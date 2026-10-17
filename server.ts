import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const isProd = process.env.NODE_ENV === 'production';

app.use(express.json());

// Initialize Gemini SDK with User-Agent header as required
const apiKey = process.env.GEMINI_API_KEY || '';
const ai = apiKey
  ? new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    })
  : null;

// API Route: AI Assistant Chat & Planning
app.post('/api/gemini/chat', async (req: Request, res: Response) => {
  try {
    const { messages, systemInstruction } = req.body;

    if (!ai) {
      // Graceful fallback when API key isn't provided yet
      res.json({
        reply: '현재 GEMINI_API_KEY가 설정되지 않아 로컬 스마트 도우미 모드로 동작합니다. 설정 > Secrets에서 API 키를 연결하면 최신 Gemini 지능을 즉시 활용할 수 있습니다. 할 일 관리와 포커스 타이머 기능은 완벽히 정상 작동합니다!',
      });
      return;
    }

    const conversationContents = (messages || []).map((m: { role: string; content: string }) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: conversationContents,
      config: {
        systemInstruction:
          systemInstruction ||
          '당신은 사용자의 생산성, 업무 집중, 습관 형성, 마인드셋을 지원하는 지능형 워크스페이스 코파일럿 FlowSpace AI입니다. 한국어로 정중하고 영감 넘치며 명확하게 핵심 위주로 응답해주세요.',
      },
    });

    const reply = response.text || '죄송합니다. 응답을 생성하지 못했습니다.';
    res.json({ reply });
  } catch (error: any) {
    console.error('Gemini chat error:', error);
    res.status(500).json({
      error: error.message || 'Gemini 요청 처리 중 오류가 발생했습니다.',
    });
  }
});

// API Route: Smart Task / Note Helper
app.post('/api/gemini/assist', async (req: Request, res: Response) => {
  try {
    const { action, text, context } = req.body;

    if (!ai) {
      res.json({
        result: `[로컬 제안] ${text} 에 대한 세부 실행 계획을 수립하고, 오늘 바로 시작할 수 있는 첫 단계를 10분 내에 실행해보세요.`,
      });
      return;
    }

    let prompt = '';
    if (action === 'breakdown_task') {
      prompt = `다음 할 일(작업)을 더 구체적이고 바로 실행 가능한 3~5개의 하위 액션 스텝(체크리스트)으로 세분화해줘:\n\n작업: "${text}"\n\n응답 형식: 각 줄마다 "- [ ] 작업 내용" 형식으로 간결하게 작성해줘.`;
    } else if (action === 'summarize_note') {
      prompt = `다음 메모/노트 내용을 핵심 요약 3줄과 실행 포인트로 깔끔하게 정리해줘:\n\n내용:\n${text}`;
    } else if (action === 'improve_writing') {
      prompt = `다음 메모를 더 전문적이고 명확하며 가독성 높은 문장으로 다듬어줘:\n\n원문:\n${text}`;
    } else if (action === 'recommend_routines') {
      prompt = `사용자의 목표나 관심사("${text}")에 맞춰 매일 15분 이내에 실천할 수 있는 효과적인 습관 3가지를 추천하고 이유를 짧게 적어줘.`;
    } else {
      prompt = `${text}\n\n추가 맥락: ${context || '없음'}`;
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction:
          '사용자의 생산성을 극대화하는 프로페셔널 어시스턴트입니다. 한국어로 실용적이고 군더더기 없는 답변을 제공합니다.',
      },
    });

    res.json({ result: response.text || '' });
  } catch (error: any) {
    console.error('Gemini assist error:', error);
    res.status(500).json({
      error: error.message || '요청 처리 중 오류가 발생했습니다.',
    });
  }
});

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

async function startServer() {
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get('*', (_req, res) => {
        res.sendFile(path.resolve(distPath, 'index.html'));
      });
    }
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`FlowSpace server running at http://0.0.0.0:${port}`);
  });
}

startServer();
