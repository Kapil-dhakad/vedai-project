import { Request, Response, NextFunction } from 'express';
import Assignment, { IAssignment } from '../models/Assignment';
import QuestionPaper from '../models/QuestionPaper';
import { addGenerationJob } from '../queues/generationQueue';
import { extractTextFromFile } from '../middleware/upload';
import { createError } from '../middleware/errorHandler';
import { getRedisClient } from '../config/redis';

const CACHE_TTL = 300;

const redisGet = async (key: string): Promise<string | null> => {
  try { return await getRedisClient().get(key); }
  catch { return null; }
};
const redisSet = async (key: string, ttl: number, value: string): Promise<void> => {
  try { await getRedisClient().setex(key, ttl, value); }
  catch { /* caching skipped */ }
};
const redisDel = async (...keys: string[]): Promise<void> => {
  try { await getRedisClient().del(...keys); }
  catch { /* cache clear skipped */ }
};


export const createAssignment = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const {
      title, subject, grade, schoolName,
      dueDate, questionTypes, additionalInstructions,
    } = req.body;

    if (!title || !subject || !grade || !dueDate || !questionTypes) {
      throw createError('Missing required fields: title, subject, grade, dueDate, questionTypes', 400);
    }

    let parsedQuestionTypes = questionTypes;
    if (typeof questionTypes === 'string') {
      parsedQuestionTypes = JSON.parse(questionTypes);
    }

    const hasQuestions = parsedQuestionTypes.some(
      (qt: IAssignment['questionTypes'][0]) => qt.noOfQuestions > 0
    );
    if (!hasQuestions) {
      throw createError('At least one question type must have questions', 400);
    }

    let fileUrl: string | undefined;
    let extractedText: string | undefined;

    if (req.file) {
      fileUrl = req.file.path;
      try {
        extractedText = await extractTextFromFile(req.file.path, req.file.mimetype);
        console.log(`📄 Extracted ${extractedText.length} chars from uploaded file`);
      } catch (err) {
        console.warn('⚠️  Could not extract text from file:', err);
      }
    }

    const assignment = await Assignment.create({
      title, subject, grade,
      schoolName: schoolName || 'Delhi Public School, Bokaro',
      dueDate: new Date(dueDate),
      questionTypes: parsedQuestionTypes,
      additionalInstructions,
      fileUrl, extractedText,
      status: 'pending',
    });

    try {
      const jobId = await addGenerationJob(assignment._id.toString());
      await Assignment.findByIdAndUpdate(assignment._id, { jobId });
      console.log(`📋 Assignment created: ${assignment._id}, Job: ${jobId}`);
    } catch (queueErr) {
      console.error('❌ Could not enqueue job (Redis down?):', (queueErr as Error).message);
      await Assignment.findByIdAndUpdate(assignment._id, {
        status: 'failed',
        errorMessage: 'Job queue unavailable. Check Redis connection.',
      });
    }

    res.status(201).json({
      success: true,
      data: assignment,
      message: 'Assignment created. AI generation started.',
    });
  } catch (err) {
    next(err);
  }
};

export const getAssignments = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const filter: Record<string, string> = {};
    if (status && typeof status === 'string') filter.status = status;

    const assignments = await Assignment.find(filter)
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit))
      .lean();

    const total = await Assignment.countDocuments(filter);

    res.json({
      success: true,
      data: assignments,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (err) {
    next(err);
  }
};

export const getAssignment = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const cacheKey = `assignment:${req.params.id}`;
    const cached = await redisGet(cacheKey);
    if (cached) {
      res.json({ success: true, data: JSON.parse(cached), cached: true });
      return;
    }

    const assignment = await Assignment.findById(req.params.id).lean();
    if (!assignment) throw createError('Assignment not found', 404);

    if (assignment.status === 'completed') {
      await redisSet(cacheKey, CACHE_TTL, JSON.stringify(assignment));
    }

    res.json({ success: true, data: assignment });
  } catch (err) {
    next(err);
  }
};

export const getQuestionPaper = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const cacheKey = `paper:${req.params.id}`;
    const cached = await redisGet(cacheKey);
    if (cached) {
      res.json({ success: true, data: JSON.parse(cached), cached: true });
      return;
    }

    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) throw createError('Assignment not found', 404);

    if (assignment.status !== 'completed') {
      res.json({
        success: false,
        status: assignment.status,
        message: `Question paper not ready. Current status: ${assignment.status}`,
      });
      return;
    }

    const paper = await QuestionPaper.findOne({ assignmentId: req.params.id }).lean();
    if (!paper) throw createError('Question paper not found', 404);

    await redisSet(cacheKey, CACHE_TTL, JSON.stringify(paper));
    res.json({ success: true, data: paper });
  } catch (err) {
    next(err);
  }
};

export const regenerateAssignment = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) throw createError('Assignment not found', 404);

    await QuestionPaper.deleteOne({ assignmentId: req.params.id });
    await redisDel(`assignment:${req.params.id}`, `paper:${req.params.id}`);

    await Assignment.findByIdAndUpdate(req.params.id, {
      status: 'pending',
      questionPaperId: null,
      errorMessage: null,
    });

    const jobId = await addGenerationJob(req.params.id);
    await Assignment.findByIdAndUpdate(req.params.id, { jobId });

    res.json({ success: true, message: 'Regeneration started', jobId });
  } catch (err) {
    next(err);
  }
};

export const deleteAssignment = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) throw createError('Assignment not found', 404);

    await QuestionPaper.deleteOne({ assignmentId: req.params.id });
    await Assignment.deleteOne({ _id: req.params.id });
    await redisDel(`assignment:${req.params.id}`, `paper:${req.params.id}`);

    res.json({ success: true, message: 'Assignment deleted successfully' });
  } catch (err) {
    next(err);
  }
};
