import express from 'express';
import multer from 'multer';
import { analyseCsv } from '../utils/csvAnalyzer.js';
import { requestMappingSuggestion } from '../utils/openaiClient.js';
import { requireSupportToken } from '../middleware/supportAuth.js';
import { BankMappingService } from '../services/bankMappingService.js';

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });
const router = express.Router();

router.use((req, _res, next) => {
  req.pool = req.app.locals.pool;
  req.bankMappingService = new BankMappingService(req.pool);
  next();
});

router.use(requireSupportToken);

router.get('/', async (req, res, next) => {
  try {
    const mappings = await req.bankMappingService.list({ search: req.query.search });
    res.json({ data: mappings });
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const mapping = await req.bankMappingService.get(req.params.id);
    if (!mapping) {
      return res.status(404).json({ message: 'Bank mapping not found' });
    }
    res.json({ data: mapping });
  } catch (error) {
    next(error);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const created = await req.bankMappingService.create(req.body);
    res.status(201).json({ data: created });
  } catch (error) {
    if (error.code === '23505') {
      error.status = 409;
      error.message = 'A mapping for this bank name already exists';
    }
    next(error);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    const updated = await req.bankMappingService.update(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ message: 'Bank mapping not found' });
    }
    res.json({ data: updated });
  } catch (error) {
    next(error);
  }
});

router.post('/analyze', upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) {
      const error = new Error('No CSV file uploaded');
      error.status = 400;
      throw error;
    }

    const delimiter = req.body.delimiter || ';';
    const analysis = analyseCsv(req.file.buffer, delimiter);

    res.json({
      data: {
        ...analysis,
        detection_hints: analysis.without_header
          ? {
              without_header: {
                column_count: analysis.column_count,
                column_markers: analysis.column_markers,
              },
            }
          : {
              header_signature: analysis.header_signature,
            },
      },
    });
  } catch (error) {
    next(error);
  }
});

router.post('/suggest', upload.single('file'), async (req, res, next) => {
  try {
    const assistantId = process.env.OPENAI_ASSISTANT_ID;
    const csvSample = req.file ? req.file.buffer.toString('utf-8') : req.body.csvSample;
    if (!csvSample) {
      const error = new Error('A CSV sample is required for AI suggestions');
      error.status = 400;
      throw error;
    }

    const delimiter = req.body.delimiter || ';';
    const analysis = analyseCsv(Buffer.from(csvSample, 'utf-8'), delimiter);

    let additionalContext = {};
    if (req.body.additionalContext) {
      try {
        additionalContext =
          typeof req.body.additionalContext === 'string'
            ? JSON.parse(req.body.additionalContext)
            : req.body.additionalContext;
      } catch (parseError) {
        console.warn('Could not parse additionalContext payload', parseError);
      }
    }

    const suggestion = await requestMappingSuggestion({
      assistantId,
      csvSample,
      analysis,
      additionalContext,
    });

    res.json({ data: suggestion, analysis });
  } catch (error) {
    next(error);
  }
});

export default router;
