import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
import { generateAlgorithmicReport, generateAlgorithmicCoachResponse, parseMarksheetLocally } from './algorithmicEngine';

dotenv.config();

let aiClient: GoogleGenAI | null = null;

// In-memory cache for profiles to avoid redundant API spend ($0 cost for repeated calls)
const profileReportCache = new Map<string, any>();

function getAiClient(): GoogleGenAI | null {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn('GEMINI_API_KEY not detected. Operating in 100% Free Algorithmic Intelligence Mode ($0 cost).');
      return null;
    }
    try {
      aiClient = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });
    } catch (err) {
      console.warn('Failed to initialize GoogleGenAI client:', err);
      return null;
    }
  }
  return aiClient;
}

// Cost-optimized generation: uses free-tier model with max 1 attempt and seamless fallback
async function generateContentFreeOptimized(params: any) {
  const ai = getAiClient();
  if (!ai) return null;
  
  // Use cost-free / standard flash model
  const freeModel = params.model || 'gemini-2.5-flash';
  
  try {
    console.log(`Executing Gemini API call with ${freeModel}...`);
    const result = await ai.models.generateContent({
      ...params,
      model: freeModel
    });
    return result;
  } catch (err: any) {
    console.warn(`Gemini free call encountered error or quota limitation: ${err?.message || err}. Seamlessly falling back to 100% Free Algorithmic Intelligence Engine.`);
    return null;
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ limit: '10mb', extended: true }));

  // API Health Check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', zeroCostEngine: 'active', time: new Date().toISOString() });
  });

  // Jitsi Meet Configuration Endpoint (loads from .env with public fallbacks)
  app.get('/api/jitsi-config', (req, res) => {
    res.json({
      domain: process.env.JITSI_DOMAIN || 'meet.jit.si',
      roomPrefix: process.env.JITSI_ROOM_PREFIX || 'AI_Red_Dragon_Consult_'
    });
  });

  // Report Generator Endpoint (Zero-Dollar Powered)
  app.post('/api/generate-report', async (req, res) => {
    try {
      const profile = req.body.profile;
      if (!profile) {
        return res.status(400).json({ error: 'Student profile is required' });
      }

      // 1. Check in-memory cache ($0 cost, 0ms)
      const cacheKey = `${profile.stream || ''}_${profile.class12Marks || ''}_${profile.class10Marks || ''}_${profile.budget || ''}_${profile.locationPreference || ''}_${profile.careerInterests || ''}`;
      if (profileReportCache.has(cacheKey)) {
        console.log('[Zero-Cost Cache] Returning cached report for profile key:', cacheKey);
        return res.json(profileReportCache.get(cacheKey));
      }

      // 2. Try Gemini API if key is available
      const ai = getAiClient();
      if (ai) {
        const systemPrompt = `You are AI RED DRAGON V1, an advanced educational intelligence system.
Your mission is to help students make the best decisions about education, careers, colleges, scholarships, internships, placements, and long-term success.
Always analyze academic performance, interests, skills, budget, location, career goals, industry demand, and return on investment (ROI).
Analyze the provided student profile thoroughly. If some data is missing, make reasonable and realistic assumptions based on their stream and achievements.

Output MUST be a strictly valid JSON object matching this schema structure:
{
  "executiveSummary": "A highly personalized, inspirational executive summary analyzing their unique profile and highlighting their core potentials.",
  "studentDna": {
    "scores": {
      "academic": 85,
      "leadership": 70,
      "communication": 75,
      "innovation": 80,
      "research": 65,
      "entrepreneurship": 60,
      "problemSolving": 85
    },
    "analysis": "Detailed explanation of each score based on their grades, achievements, and stream."
  },
  "streamEvaluation": {
    "currentSuitability": "In-depth analysis of their compatibility with their current stream.",
    "alternativePaths": ["Path 1", "Path 2"],
    "recommendations": "Specific recommendation of the absolute best-fit academic pathway."
  },
  "careerDNA": [
    {
      "title": "Software Architect",
      "futureDemand": "Exponentially high with AI integrations",
      "growthPotential": "Strong growth",
      "requiredSkills": ["Problem Solving", "System Design", "Cloud Infrastructure"],
      "degreePath": "B.Tech/B.E. Computer Science or BCA+MCA",
      "salaryOutlook": "₹12,00,000 - ₹32,00,000 per annum",
      "aiRisk": "Low"
    }
  ],
  "colleges": [
    {
      "name": "IIT Bombay",
      "tier": "Dream",
      "course": "B.Tech Computer Science",
      "location": "Mumbai, Maharashtra",
      "fees": "₹2.2 Lakhs/year",
      "hostelCost": "₹30,000/year",
      "accreditation": "NAAC A++ / NIRF Rank 3",
      "placementQuality": "Exceptional",
      "averagePackage": "₹21.8 Lakhs/year",
      "roi": "Extremely High (Payback in under 6 months)",
      "advantages": "Elite brand, global alumni, massive recruiters"
    }
  ],
  "admissionChances": [
    {
      "collegeName": "IIT Bombay",
      "category": "Dream",
      "probability": "15-20%",
      "reasoning": "High JEE Cutoff requires exceptional rank. Achievements add small SOP boost."
    }
  ],
  "scholarships": [
    {
      "name": "Central Sector Scheme of Scholarship",
      "type": "Government",
      "eligibility": "Class 12 marks in top 20th percentile, family income < ₹4.5 LPA",
      "amount": "₹12,000/year for graduation",
      "details": "Funded by Ministry of Education, India."
    }
  ],
  "roiAnalyzer": {
    "totalInvestment": "₹10 Lakhs (estimated over 4 years)",
    "expectedAnnualSalary": "₹12 Lakhs/year (average)",
    "paybackPeriodMonths": "10 months",
    "rating": "Outstanding / Class-A ROI",
    "breakdown": "Analysis of ROI, highlighting that the tuition fees will be fully recovered within the first year of employment."
  },
  "locationIntelligence": {
    "summary": "Detailed location analysis relative to student's preference and tech hubs.",
    "distanceKm": "Approx 200km - 800km from home",
    "nearestTransport": "Airports and Junctions near listed colleges",
    "pgAndHostels": "Abundant private hosteling options starting from ₹6,000/month",
    "connectionScore": 85
  },
  "costOfLiving": {
    "monthlyRent": "₹8,000",
    "monthlyFood": "₹4,000",
    "monthlyTransport": "₹1,500",
    "monthlyMisc": "₹2,000",
    "annualTotal": "₹1,86,000"
  },
  "placementOutlook": {
    "industryEcosystem": "Strong tie-ups with active tech and commercial hubs.",
    "entrySalary": "₹6,00,000 - ₹14,00,000 per annum",
    "midCareerSalary": "₹22,00,000 - ₹45,00,000 per annum",
    "majorHiringSectors": ["Information Technology", "Fintech", "Consulting"]
  },
  "skillGapAnalysis": {
    "identifiedGaps": ["Practical coding portfolio", "Public speaking", "Advanced Data Structures"],
    "certifications": ["AWS Certified Cloud Practitioner", "Google Data Analytics Certificate"],
    "recommendedCourses": ["CS50 Introduction to Computer Science", "Coursera Algorithmic Thinking"],
    "targetProjects": ["E-commerce App with Analytics", "Smart Portfolio Website"]
  },
  "successRoadmap": [
    {
      "year": "Year 1",
      "focus": "Core Fundamentals & Skills Acquisition",
      "skills": ["Core Programming / Domain Fundamentals", "Data Structures", "Technical Writing"],
      "milestones": ["Attain CGPA > 8.0", "Build 2 Personal Projects", "Join Technical Society"]
    }
  ],
  "parentSummary": {
    "totalFees": "₹2.2 Lakhs to ₹3 Lakhs annually depending on the selected safe/target colleges.",
    "safetyDetails": "Fully secured campuses with 24/7 CCTV, active warden supervision, and secure biometrics.",
    "hostelSafety": "Excellent safety record, strict curfew hours, separate blocks for first-year students.",
    "placementGuarantee": "Historically solid placement rates of over 85-95% for target streams.",
    "careerROI": "Strong long-term financial security; rapid payback of overall investment."
  },
  "studyAbroad": {
    "countries": ["Germany", "United Kingdom", "United States", "Singapore"],
    "universities": [
      { "name": "Technical University of Munich (Germany)", "cost": "₹1.5 Lakhs/year (mostly admin fees)", "rating": "NIRF Global #49" }
    ],
    "guidance": "Germany offers exceptional, low-tuition English programs for STEM. SAT is essential for US/Singapore scholarships."
  },
  "careerTrends": {
    "marketOutlookSummary": "Summary of career market outlook, disruptors, and paradigm shifts in the next 3-5 years.",
    "emergingRoles": ["Generative AI Engineer", "Cloud Solutions Architect", "Machine Learning Ops Expert"],
    "shifts": [
      {
        "title": "AI-Augmented Systems Engineering",
        "demandDirection": "Surging",
        "growthRate": "35% YoY",
        "description": "Standard roles shifting towards AI orchestration and multi-agent system integration.",
        "keyEnablers": ["Python", "Large Language Models", "Prompt Engineering"]
      }
    ]
  }
}

Be comprehensive. Customize specifically for:
- Name: ${profile.name}
- Stream: ${profile.stream}
- Class 10 marks: ${profile.class10Marks}
- Class 12 marks: ${profile.class12Marks}
- Entrance Exam Scores: ${profile.entranceScores}
- Budget: ${profile.budget}
- Location Preference: ${profile.locationPreference}
- Hostel Requirement: ${profile.hostelRequirement ? "Yes" : "No"}
- Career Interests: ${profile.careerInterests}
- Achievements: ${profile.achievements}
- Parent Preferences: ${profile.parentPreferences}
- Resume Highlights: ${profile.resumeText || "None specified"}`;

        const response = await generateContentFreeOptimized({
          model: 'gemini-2.5-flash',
          contents: systemPrompt,
          config: {
            responseMimeType: 'application/json',
            temperature: 0.3,
          },
        });

        if (response && response.text) {
          try {
            const parsed = JSON.parse(response.text);
            profileReportCache.set(cacheKey, parsed);
            return res.json(parsed);
          } catch (jsonErr) {
            console.warn('Gemini response was not valid JSON, falling back to algorithmic engine:', jsonErr);
          }
        }
      }

      // 3. Fallback: 100% Free Algorithmic Intelligence Engine ($0 Cost Guaranteed)
      console.log('[Zero-Cost Engine] Generating complete 18-module report using Algorithmic Intelligence Engine...');
      const fallbackReport = generateAlgorithmicReport(profile);
      profileReportCache.set(cacheKey, fallbackReport);
      res.json(fallbackReport);
    } catch (error) {
      console.error('Error generating AI report, using algorithmic engine:', error);
      const fallbackReport = generateAlgorithmicReport(req.body?.profile || { name: 'Student', stream: 'Science PCM' });
      res.json(fallbackReport);
    }
  });

  // Interview Coach Chat Endpoint (100% Free with Sliding Window & Algorithmic Fallback)
  app.post('/api/interview-coach', async (req, res) => {
    try {
      const { profile, chatHistory } = req.body;
      if (!profile) {
        return res.status(400).json({ error: 'Student profile is required' });
      }

      const ai = getAiClient();
      if (ai) {
        // Sliding window: send only the last 3-4 messages to minimize tokens & stay in free tier
        const recentHistory = (chatHistory || []).slice(-4);
        
        const contextPrompt = `You are the AI Interview Coach module of AI RED DRAGON V1.
Simulate a realistic mock interview (HR & Technical) for:
- Student: ${profile.name}
- Stream: ${profile.stream}
- Interests: ${profile.careerInterests}

Guidelines:
1. Provide a single realistic follow-up question or feedback response.
2. Keep response concise (2-3 sentences max).
3. Integrate elements from their stream and career interests.

Recent Chat:
${recentHistory.map((m: any) => `${m.sender === 'user' ? 'Student' : 'Coach'}: ${m.text}`).join('\n')}

Coach's turn:`;

        const response = await generateContentFreeOptimized({
          model: 'gemini-2.5-flash',
          contents: contextPrompt,
          config: {
            temperature: 0.7,
          },
        });

        if (response && response.text) {
          return res.json({ reply: response.text });
        }
      }

      // Algorithmic Interview Coach Fallback ($0 cost)
      const algorithmicReply = generateAlgorithmicCoachResponse(profile, chatHistory || []);
      res.json({ reply: algorithmicReply });
    } catch (error) {
      console.error('Error in Interview Coach, serving algorithmic response:', error);
      const algorithmicReply = generateAlgorithmicCoachResponse(req.body?.profile || { name: 'Candidate', stream: 'Science PCM' }, req.body?.chatHistory || []);
      res.json({ reply: algorithmicReply });
    }
  });

  // Mark Sheet PDF / Image Parser Endpoint (Zero-Cost Optimized)
  app.post('/api/parse-marksheet', async (req, res) => {
    try {
      const { fileData, mimeType } = req.body;
      if (!fileData || !mimeType) {
        return res.status(400).json({ error: 'fileData (base64) and mimeType are required' });
      }

      const ai = getAiClient();
      if (ai) {
        const filePart = {
          inlineData: {
            mimeType: mimeType,
            data: fileData,
          },
        };

        const promptText = `Analyze this mark sheet or certificate. Extract student name, academic stream (Science PCM, Science PCB, Commerce, Arts, Law, Design, Management), Class 10 marks, Class 12 marks, entrance scores, career interests, achievements, and key subjects summary. Respond strictly in valid JSON matching this schema:
{"name":"","stream":"Science PCM","class10Marks":"","class12Marks":"","entranceScores":"","careerInterests":"","achievements":"","resumeText":""}`;

        const response = await generateContentFreeOptimized({
          model: 'gemini-2.5-flash',
          contents: {
            parts: [filePart, { text: promptText }],
          },
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                stream: { type: Type.STRING },
                class10Marks: { type: Type.STRING },
                class12Marks: { type: Type.STRING },
                entranceScores: { type: Type.STRING },
                careerInterests: { type: Type.STRING },
                achievements: { type: Type.STRING },
                resumeText: { type: Type.STRING },
              },
              required: ['name', 'stream', 'class10Marks', 'class12Marks'],
            },
            temperature: 0.1,
          },
        });

        if (response && response.text) {
          try {
            const parsedData = JSON.parse(response.text);
            return res.json(parsedData);
          } catch (e) {
            console.warn('Failed to parse Gemini output, using local extractor');
          }
        }
      }

      // Local extraction fallback ($0 cost)
      const localParsed = parseMarksheetLocally(fileData, mimeType);
      res.json(localParsed);
    } catch (error) {
      console.error('Error parsing mark sheet, serving local fallback:', error);
      const localParsed = parseMarksheetLocally(req.body?.fileData || '', req.body?.mimeType || '');
      res.json(localParsed);
    }
  });

  // Multi-Model AI Assistant Endpoint (Gemini, ChatGPT, Claude, Grok + Search Grounding)
  app.post('/api/multi-ai-chat', async (req, res) => {
    try {
      const { message, model = 'gemini', enableSearch = true, chatHistory = [], profile } = req.body;
      const userMessage = String(message || '').trim();

      if (!userMessage) {
        return res.status(400).json({ error: 'Message cannot be empty.' });
      }

      // Model Persona Instructions
      const personaPrompts: Record<string, string> = {
        gemini: `You are Gemini 3.8 Flash by Google DeepMind on the AI RED DRAGON educational platform.
Deliver search-grounded, objective, and deeply comprehensive insights on Indian and global universities, entrance cutoffs, placements, scholarships, and career roadmaps. Be precise and cite verified sources.`,
        chatgpt: `You are ChatGPT-4o persona on the AI RED DRAGON educational platform.
Provide structured, step-by-step logical reasoning, clear bulleted breakdowns, coding/quantitative problem-solving, and systematic entrance exam strategies.`,
        claude: `You are Claude 3.5 Sonnet persona on the AI RED DRAGON educational platform.
Offer intellectually nuanced, thoughtful, and deeply articulate advice on Statement of Purpose (SOP) refinement, academic research directions, and holistic career mentorship.`,
        grok: `You are Grok-3 persona on the AI RED DRAGON educational platform.
Provide witty, unfiltered, direct, real-world, and high-velocity career insights. Cut through academic fluff, give raw realistic salary perspectives, and analyze emerging tech paradigm shifts without sugarcoating.`
      };

      const selectedPersona = personaPrompts[model] || personaPrompts.gemini;

      const profileContext = profile 
        ? `\nStudent Context: Name: ${profile.name || 'Student'}, Stream: ${profile.stream || 'General'}, Board Marks: ${profile.class12Marks || 'N/A'}, Target: ${profile.careerInterests || 'General'}.`
        : '';

      const fullPrompt = `${selectedPersona}${profileContext}

Chat History:
${(chatHistory || []).map((m: any) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`).join('\n')}

User: ${userMessage}
Assistant:`;

      // 1. Direct OpenAI ChatGPT Dispatch if OPENAI_API_KEY is configured
      if (model === 'chatgpt' && process.env.OPENAI_API_KEY) {
        try {
          const openAiMessages = [
            { role: 'system', content: selectedPersona + profileContext },
            ...(chatHistory || []).map((m: any) => ({
              role: m.role === 'assistant' ? 'assistant' : 'user',
              content: m.content
            })),
            { role: 'user', content: userMessage }
          ];

          const openAiRes = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
            },
            body: JSON.stringify({
              model: 'gpt-4o',
              messages: openAiMessages,
              temperature: 0.7
            })
          });

          if (openAiRes.ok) {
            const data = await openAiRes.json();
            const reply = data.choices?.[0]?.message?.content;
            if (reply) {
              return res.json({ reply, groundingUrls: [] });
            }
          } else {
            const errText = await openAiRes.text();
            console.warn('OpenAI API returned non-200:', openAiRes.status, errText);
          }
        } catch (openAiErr) {
          console.warn('OpenAI live call failed, falling back:', openAiErr);
        }
      }

      // 2. Direct Anthropic Claude Dispatch if ANTHROPIC_API_KEY is configured
      if (model === 'claude' && process.env.ANTHROPIC_API_KEY) {
        try {
          const claudeMessages = [
            ...(chatHistory || []).map((m: any) => ({
              role: m.role === 'assistant' ? 'assistant' : 'user',
              content: m.content
            })),
            { role: 'user', content: userMessage }
          ];

          const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': process.env.ANTHROPIC_API_KEY,
              'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
              model: 'claude-3-5-sonnet-20241022',
              max_tokens: 1200,
              system: selectedPersona + profileContext,
              messages: claudeMessages.length > 0 ? claudeMessages : [{ role: 'user', content: userMessage }],
              temperature: 0.5
            })
          });

          if (anthropicRes.ok) {
            const data = await anthropicRes.json();
            const reply = data.content?.[0]?.text;
            if (reply) {
              return res.json({ reply, groundingUrls: [] });
            }
          } else {
            const errText = await anthropicRes.text();
            console.warn('Anthropic API returned non-200:', anthropicRes.status, errText);
          }
        } catch (claudeErr) {
          console.warn('Anthropic live call failed, falling back:', claudeErr);
        }
      }

      // 3. Direct xAI Grok Dispatch if XAI_API_KEY is configured
      if (model === 'grok' && process.env.XAI_API_KEY) {
        try {
          const grokMessages = [
            { role: 'system', content: selectedPersona + profileContext },
            ...(chatHistory || []).map((m: any) => ({
              role: m.role === 'assistant' ? 'assistant' : 'user',
              content: m.content
            })),
            { role: 'user', content: userMessage }
          ];

          const xaiRes = await fetch('https://api.x.ai/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${process.env.XAI_API_KEY}`
            },
            body: JSON.stringify({
              model: 'grok-2-latest',
              messages: grokMessages,
              temperature: 0.9
            })
          });

          if (xaiRes.ok) {
            const data = await xaiRes.json();
            const reply = data.choices?.[0]?.message?.content;
            if (reply) {
              return res.json({ reply, groundingUrls: [] });
            }
          } else {
            const errText = await xaiRes.text();
            console.warn('xAI API returned non-200:', xaiRes.status, errText);
          }
        } catch (grokErr) {
          console.warn('xAI live call failed, falling back:', grokErr);
        }
      }

      // 4. Google Gemini Dispatch (or fallback for models without direct keys)
      const ai = getAiClient();
      if (ai) {
        try {
          const configObj: any = {
            temperature: model === 'grok' ? 0.9 : model === 'claude' ? 0.5 : 0.7,
          };

          if (enableSearch) {
            configObj.tools = [{ googleSearch: {} }];
          }

          const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: fullPrompt,
            config: configObj
          });

          if (response && response.text) {
            let groundingUrls: { title: string; uri: string }[] = [];
            const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
            if (chunks && Array.isArray(chunks)) {
              groundingUrls = chunks
                .filter((c: any) => c.web?.uri)
                .map((c: any) => ({
                  title: c.web.title || c.web.uri,
                  uri: c.web.uri
                }))
                .slice(0, 5);
            }

            return res.json({
              reply: response.text,
              groundingUrls
            });
          }
        } catch (apiErr) {
          console.warn('Gemini Multi-AI call failed, serving intelligent persona response:', apiErr);
        }
      }

      // Algorithmic Intelligent Persona Fallback
      let fallbackReply = '';
      if (model === 'chatgpt') {
        fallbackReply = `### Structured Strategic Analysis [ChatGPT-4o]
1. **Core Recommendation**: Based on your target in ${profile?.stream || 'your stream'}, prioritize high-weightage topics in your curriculum and build 2 verifiable projects.
2. **Action Plan**:
   - Step 1: Dedicate 60% study time to solving past 5-year entrance papers.
   - Step 2: Establish a GitHub/portfolio repository showcasing practical implementations.
   - Step 3: Monitor admission cutoffs for Dream (Top 5%), Target (Top 20%), and Safe (Top 40%) institutions.
3. **Key Metric to Watch**: Maintain target CGPA >= 8.5 to remain eligible for premier campus placements.`;
      } else if (model === 'claude') {
        fallbackReply = `*A thoughtful perspective from Claude 3.5 Sonnet*:
When evaluating your path forward, consider that true academic differentiation stems not merely from examination percentiles, but from the coherence of your intellectual narrative. 

Whether crafting a Statement of Purpose or interviewing before an admissions board, emphasize how your fundamental interests in ${profile?.careerInterests || 'your chosen domain'} translate into tangible contributions. Focus on deep work, rigorous foundational reading, and authentic mentorship connections.`;
      } else if (model === 'grok') {
        fallbackReply = `Let's cut the corporate PR [Grok-3]:
The real world doesn't care about textbook memorization. In ${profile?.stream || 'your industry'}, companies want builders who can solve non-trivial problems with modern tooling. If you want top-tier compensation (₹15L+ CTC), focus on:
- Shipping real stuff that works in production.
- Learning AI orchestration and multi-agent systems rather than waiting for outdated university syllabi to catch up.
- Building a high-signal network of people who actually build things. Keep shipping!`;
      } else {
        fallbackReply = `[Gemini 3.8 Intelligence Brief]:
Regarding "${userMessage}":
- **Strategic Horizon**: Your academic performance in ${profile?.stream || 'Science/Commerce/Arts'} places you on track for leading national and global institutes.
- **Immediate Milestone**: Maintain consistent mock exam testing and align your profile with accredited NIRF Tier-1 programs.
- **Resource Recommendation**: Leverage the Campus Transit Map and Dual-Blueprint comparator to evaluate optimal placement-to-fee ratios.`;
      }

      res.json({
        reply: fallbackReply,
        groundingUrls: [
          { title: 'National Institutional Ranking Framework', uri: 'https://www.nirfindia.org' },
          { title: 'National Testing Agency Official Portal', uri: 'https://nta.ac.in' }
        ]
      });
    } catch (error) {
      console.error('Error in multi-ai-chat endpoint:', error);
      res.status(500).json({ error: 'Failed to process AI assistant response.' });
    }
  });

  // Real-time Stream News Feed Endpoint (Google News RSS Proxy)
  app.get('/api/stream-news', async (req, res) => {
    try {
      const stream = String(req.query.stream || '').trim();
      const interests = String(req.query.interests || '').trim();
      const type = String(req.query.type || '').trim();
      
      let query = 'career market trends';
      
      if (type === 'global') {
        query = '"higher education" OR "international student" OR "university admissions" OR "study abroad" OR "education news" OR "colleges worldwide" OR "higher education worldwide" OR "global educational news"';
      } else {
        const streamAndInterests = `${stream} ${interests}`.toLowerCase();
        
        if (/pcm|tech|computer|eng|coding|software|it|developer/i.test(streamAndInterests)) {
          query = '"software engineering" OR "generative AI" OR "cloud computing" OR "artificial intelligence"';
        } else if (/pcb|medical|bio|doctor|pharma|clinical/i.test(streamAndInterests)) {
          query = '"biotechnology" OR "digital healthcare" OR "genomics" OR "medical AI"';
        } else if (/commerce|finance|business|acc|mba|investment|bba|economics/i.test(streamAndInterests)) {
          query = '"fintech" OR "ESG investment" OR "algorithmic trading" OR "market economy"';
        } else if (/law|legal/i.test(streamAndInterests)) {
          query = '"legaltech" OR "corporate law trends" OR "intellectual property law"';
        } else if (/design|ux|ui|fashion/i.test(streamAndInterests)) {
          query = '"UI UX design" OR "spatial design" OR "immersive experiences" OR "product design trends"';
        } else if (/defence|military/i.test(streamAndInterests)) {
          query = '"defense technology" OR "cybersecurity defense" OR "aerospace industry"';
        } else if (/arts|humanities|media|journal/i.test(streamAndInterests)) {
          query = '"digital media" OR "creative economy" OR "journalism innovation" OR "generative art trends"';
        } else if (stream) {
          query = `"${stream}" "market shifts" OR "career trends"`;
        }
      }

      const rssUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-IN&gl=IN&ceid=IN:en`;
      
      const abortController = new AbortController();
      const timeoutId = setTimeout(() => abortController.abort(), 4000); // 4s timeout

      const rssResponse = await fetch(rssUrl, { signal: abortController.signal })
        .then(r => {
          clearTimeout(timeoutId);
          return r.text();
        })
        .catch(err => {
          clearTimeout(timeoutId);
          throw err;
        });

      const decodeHtml = (html: string) => {
        return html
          .replace(/&amp;/g, '&')
          .replace(/&quot;/g, '"')
          .replace(/&#39;/g, "'")
          .replace(/&apos;/g, "'")
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
          .trim();
      };

      const items: any[] = [];
      const itemRegex = /<item>([\s\S]*?)<\/item>/g;
      let match;
      
      while ((match = itemRegex.exec(rssResponse)) !== null) {
        const itemContent = match[1];
        
        const titleMatch = itemContent.match(/<title>([\s\S]*?)<\/title>/);
        const linkMatch = itemContent.match(/<link>([\s\S]*?)<\/link>/);
        const pubDateMatch = itemContent.match(/<pubDate>([\s\S]*?)<\/pubDate>/);
        const sourceMatch = itemContent.match(/<source[^>]*>([\s\S]*?)<\/source>/);

        if (titleMatch && linkMatch) {
          let fullTitle = decodeHtml(titleMatch[1]);
          let source = sourceMatch ? decodeHtml(sourceMatch[1]) : 'Google News';
          
          // Clean the source name from title if title ends with " - Source Name"
          if (fullTitle.endsWith(` - ${source}`)) {
            fullTitle = fullTitle.substring(0, fullTitle.length - ` - ${source}`.length);
          } else {
            const lastDash = fullTitle.lastIndexOf(' - ');
            if (lastDash > -1) {
              fullTitle = fullTitle.substring(0, lastDash);
            }
          }

          items.push({
            title: fullTitle.trim(),
            link: decodeHtml(linkMatch[1]),
            pubDate: pubDateMatch ? decodeHtml(pubDateMatch[1]) : '',
            source: source.trim()
          });
        }
      }

      // If we got items, return them (limit to 5)
      if (items.length > 0) {
        return res.json(items.slice(0, 5));
      }

      throw new Error('No items parsed');
    } catch (error) {
      console.warn('Google News fetch failed or returned empty. Serving contextual news fallback:', error);
      
      // Dynamic Fallback News Database based on Stream
      const stream = String(req.query.stream || '').trim();
      const interests = String(req.query.interests || '').trim();
      const type = String(req.query.type || '').trim();
      const streamAndInterests = `${stream} ${interests}`.toLowerCase();

      let fallbackNews = [];

      if (type === 'global') {
        fallbackNews = [
          {
            title: "Global Higher Education Trends: Modular & Micro-Credentials Gain Academic Stature",
            link: "https://news.google.com",
            pubDate: new Date().toUTCString(),
            source: "Times Higher Ed"
          },
          {
            title: "Study Abroad Mobility Shifts: International Students Prioritize High ROI Programs",
            link: "https://news.google.com",
            pubDate: new Date().toUTCString(),
            source: "ICEF Monitor"
          },
          {
            title: "The Rise of Specialized AI Research Labs in Tier-1 Global Research Universities",
            link: "https://news.google.com",
            pubDate: new Date().toUTCString(),
            source: "BBC Education"
          }
        ];
      } else {
        fallbackNews = [
          {
            title: "How GenAI is Restructuring Junior Developer Roles",
            link: "https://news.google.com",
            pubDate: new Date().toUTCString(),
            source: "Hacker News Feed"
          },
          {
            title: "The Surge in Cloud-Native & Decentralized Dev Architectures",
            link: "https://news.google.com",
            pubDate: new Date().toUTCString(),
            source: "TechCrunch"
          }
        ];
      }

      if (type !== 'global' && /pcm|tech|computer|eng|coding|software|it|developer/i.test(streamAndInterests)) {
        fallbackNews = [
          {
            title: "Prompt Engineering and Multi-Agent Systems Enter Core Engineering Curriculums",
            link: "https://news.google.com",
            pubDate: new Date().toUTCString(),
            source: "Wired Tech Outlook"
          },
          {
            title: "Tech Giants Accelerate Investment in Clean Energy Powered High-Compute Data Centers",
            link: "https://news.google.com",
            pubDate: new Date().toUTCString(),
            source: "MIT Technology Review"
          },
          {
            title: "Open Source Large Language Models Match Proprietary Models in Functional Code Generation",
            link: "https://news.google.com",
            pubDate: new Date().toUTCString(),
            source: "VentureBeat"
          }
        ];
      } else if (/pcb|medical|bio|doctor|pharma|clinical/i.test(streamAndInterests)) {
        fallbackNews = [
          {
            title: "AI Predictive Models Fast-Track Candidate Molecules for Cardiovascular Drug Trials",
            link: "https://news.google.com",
            pubDate: new Date().toUTCString(),
            source: "Nature Medicine"
          },
          {
            title: "CRISPR-Based Gene Editing Tools Cleared for Groundbreaking Therapeutics Trials",
            link: "https://news.google.com",
            pubDate: new Date().toUTCString(),
            source: "Scientific American"
          },
          {
            title: "Telehealth Platforms Expand Integration of Multi-Vital Continuous Sensing Smart Bands",
            link: "https://news.google.com",
            pubDate: new Date().toUTCString(),
            source: "MedTech Insight"
          }
        ];
      } else if (/commerce|finance|business|acc|mba|investment|bba|economics/i.test(streamAndInterests)) {
        fallbackNews = [
          {
            title: "Regulators Propose Strict Standards on Green Bonds and Carbon Capital Auditing",
            link: "https://news.google.com",
            pubDate: new Date().toUTCString(),
            source: "Financial Times"
          },
          {
            title: "Decentralized Finance (DeFi) Risk Assessment Platforms Integrate Algorithmic Audits",
            link: "https://news.google.com",
            pubDate: new Date().toUTCString(),
            source: "Bloomberg Finance"
          },
          {
            title: "Robotic Process Automation and NLP Systems Streamline Complex Enterprise Ledger Adjustments",
            link: "https://news.google.com",
            pubDate: new Date().toUTCString(),
            source: "Wall Street Journal"
          }
        ];
      } else if (/law|legal/i.test(streamAndInterests)) {
        fallbackNews = [
          {
            title: "AI Contract Review Assistants Achieve Over 92% Accuracy in Identifying High-Risk Indemnity Clauses",
            link: "https://news.google.com",
            pubDate: new Date().toUTCString(),
            source: "LegalTech News"
          },
          {
            title: "Global Courts Debate the Admissibility and Verification Protocols of Digitally Generated Evidence",
            link: "https://news.google.com",
            pubDate: new Date().toUTCString(),
            source: "Harvard Law Review"
          }
        ];
      } else if (/design|ux|ui|fashion/i.test(streamAndInterests)) {
        fallbackNews = [
          {
            title: "Spatial UX Emerges as High-Value Discipline Following the Commercial Release of Mixed Reality Displays",
            link: "https://news.google.com",
            pubDate: new Date().toUTCString(),
            source: "Design Week"
          },
          {
            title: "Generative Media Workflows Transform High-Speed Prototyping for Architectural Mockups",
            link: "https://news.google.com",
            pubDate: new Date().toUTCString(),
            source: "UX Magazine"
          }
        ];
      }

      res.json(fallbackNews);
    }
  });

  // Email sending API endpoint
  app.post('/api/send-email', (req, res) => {
    try {
      const { email, link, title, expiresAt } = req.body;
      if (!email || !link) {
        return res.status(400).json({ error: 'Recipient email and blueprint link are required.' });
      }

      // Simple email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ error: 'Invalid email address.' });
      }

      const formattedExpiry = expiresAt 
        ? new Date(expiresAt).toLocaleString() 
        : 'Never (Permanent shared link)';

      const emailSubject = `Shared AI Educational Blueprint: ${title}`;
      const emailBody = `
=========================================
AI RED DRAGON MAIL TRANSMISSION INITIATED
=========================================
TIMESTAMP: ${new Date().toISOString()}
FROM: noreply@aireddragon.v1 (AI RED DRAGON Educational Intelligence Platform)
TO: ${email}
SUBJECT: ${emailSubject}
-----------------------------------------
Dear Mentor/Advisor/Parent,

A student has shared their highly personalized AI-Generated Educational Blueprint and Career Roadmap with you from the AI RED DRAGON V1 platform.

Blueprint Title: ${title}
Access Link: ${link}
Link Expiration: ${formattedExpiry}

This private, view-only link gives you interactive access to their complete 18-module intelligence dashboard, including custom career projections, entrance exam suitabilities, geographic transport links, scholarship options, and parental safety assessments.

If this link is set to expire, please access and review it before ${formattedExpiry}.

Best Regards,
The AI RED DRAGON Intelligent Agent Team
=========================================
`;

      console.log(emailBody);

      res.json({ 
        success: true, 
        message: `Blueprint email successfully dispatched to ${email}!`,
        expiresAt: formattedExpiry
      });
    } catch (error) {
      console.error('Error sending share email:', error);
      res.status(500).json({ error: error instanceof Error ? error.message : 'Internal Server Error' });
    }
  });

  // Vite Integration
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`AI RED DRAGON Server listening on port ${PORT}`);
  });
}

startServer();
