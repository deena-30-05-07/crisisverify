import express, { Request, Response } from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import { Claim, Vote, User, TrendingClaim, CrisisType, CredibilityBadge, AIAnalysis } from "./src/types";

dotenv.config();

const PORT = 3000;
const app = express();
app.use(express.json({ limit: "10mb" }));

// Initialize Gemini Client lazily
let geminiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!geminiClient && process.env.GEMINI_API_KEY) {
    try {
      geminiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    } catch (err) {
      console.warn("Failed to initialize GoogleGenAI:", err);
    }
  }
  return geminiClient;
}

// In-Memory Database Store (Simulating Firestore Collections: "claims", "votes", "users")
const claims: Map<string, Claim> = new Map();
const votes: Map<string, Vote> = new Map(); // key: `${claimId}_${userId}`
const users: Map<string, User> = new Map();

// SSE (Server-Sent Events) clients for real-time live synchronization
const sseClients: Response[] = [];

function broadcastSSE(event: string, data: any) {
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  for (let i = sseClients.length - 1; i >= 0; i--) {
    const res = sseClients[i];
    try {
      res.write(payload);
    } catch (err) {
      sseClients.splice(i, 1);
    }
  }
}

// Seed initial authentic emergency claims for demonstration
function seedInitialData() {
  const seedUsers: User[] = [
    {
      userId: "user_emergency_desk",
      email: "desk@crisisverify.org",
      username: "EmergencyResponseDesk",
      avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
      isAnonymous: false,
      createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
      submissionCount: 14,
      reputation: 98,
      badgeTitle: "Verified First Responder",
    },
    {
      userId: "user_sarah_m",
      email: "sarah.m@gmail.com",
      username: "SarahM_CitizenReporter",
      avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
      isAnonymous: false,
      createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      submissionCount: 4,
      reputation: 76,
      badgeTitle: "Community Fact Checker",
    },
    {
      userId: "user_redcross_vol",
      email: "volunteer@redcross-relief.org",
      username: "RedCross_FieldTeam",
      avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
      isAnonymous: false,
      createdAt: new Date(Date.now() - 86400000 * 4).toISOString(),
      submissionCount: 9,
      reputation: 92,
      badgeTitle: "Certified Relief Partner",
    },
  ];

  seedUsers.forEach((u) => users.set(u.userId, u));

  const initialClaims: Claim[] = [
    {
      claimId: "claim_flood_01",
      title: "Main Street Suspension Bridge Collapsed in Riverside Flash Flood",
      description: "Viral WhatsApp post claims the downtown suspension bridge collapsed during the 4 AM flash flood wave, cutting off all evacuation routes.",
      imageUrl: "https://images.unsplash.com/photo-1547683905-f686c993aae5?w=800&auto=format&fit=crop&q=80",
      location: "Riverside County, CA",
      latitude: 33.9533,
      longitude: -117.3962,
      crisisType: "Flood",
      userId: "user_sarah_m",
      username: "SarahM_CitizenReporter",
      userAvatar: seedUsers[1].avatarUrl,
      timestamp: new Date(Date.now() - 1000 * 60 * 25).toISOString(), // 25 mins ago
      aiCredibilityScore: 18,
      aiAnalysis: {
        credibilityScore: 18,
        redFlags: [
          "Recycled disaster imagery from 2019 monsoon in another state",
          "Official Dept of Transportation live camera confirms bridge is open with reduced speed",
          "Urgent forwarding chain typical of panic-inducing hoaxes",
        ],
        supportingEvidence: ["Caltrans Highway Status report 04:30 confirms roadway integrity"],
        reasoning: "Image metadata traces back to a 2019 flood in a different jurisdiction. Caltrans official traffic sensors show traffic currently passing safely over the bridge.",
        badge: "False",
        analyzedAt: new Date(Date.now() - 1000 * 60 * 24).toISOString(),
        modelUsed: "gemini-3.8-flash",
      },
      credibilityBadge: "False",
      helpfulVotes: 4,
      misleadingVotes: 38,
      totalVotes: 42,
      status: "Active",
      spreadRate: "620 shares/hr",
      isTrendingFalse: true,
    },
    {
      claimId: "claim_quake_02",
      title: "Tap Water Contaminated with Industrial Solvent After Seismic Pipe Fracture",
      description: "Social media warning claims city water supply is toxic and citizens must not shower or drink after the 6.2 tremor.",
      imageUrl: "https://images.unsplash.com/photo-1527482797697-8795b05a13fe?w=800&auto=format&fit=crop&q=80",
      location: "Bay Area Metro, CA",
      latitude: 37.7749,
      longitude: -122.4194,
      crisisType: "Earthquake",
      userId: "user_emergency_desk",
      username: "EmergencyResponseDesk",
      userAvatar: seedUsers[0].avatarUrl,
      timestamp: new Date(Date.now() - 1000 * 60 * 55).toISOString(),
      aiCredibilityScore: 22,
      aiAnalysis: {
        credibilityScore: 22,
        redFlags: [
          "No municipal advisory issued by City Water Works",
          "Sensational claims linking earthquake to fictional chemical solvent factory",
          "Audio note circulating without official verification or official speaker name",
        ],
        supportingEvidence: ["Water Department emergency bulletin 06:15 confirms normal pressure & testing negative for contaminants"],
        reasoning: "Municipal water authorities ran automated pressure and chemical diagnostics following the tremor. Water remains potable; boil-water advisory has not been triggered.",
        badge: "False",
        analyzedAt: new Date(Date.now() - 1000 * 60 * 54).toISOString(),
        modelUsed: "gemini-3.8-flash",
      },
      credibilityBadge: "False",
      helpfulVotes: 2,
      misleadingVotes: 49,
      totalVotes: 51,
      status: "Active",
      spreadRate: "890 shares/hr",
      isTrendingFalse: true,
    },
    {
      claimId: "claim_shelter_03",
      title: "Civic Memorial Arena Opened as 24-Hour Emergency Evacuation Shelter",
      description: "Arena management has opened Gates A through D with 1,200 cots, warm meals, infant formula, and pet-friendly accommodations.",
      imageUrl: "https://images.unsplash.com/photo-1584467735871-8e85353a8413?w=800&auto=format&fit=crop&q=80",
      location: "Downtown Civic Center",
      latitude: 34.0522,
      longitude: -118.2437,
      crisisType: "Severe Storm",
      userId: "user_redcross_vol",
      username: "RedCross_FieldTeam",
      userAvatar: seedUsers[2].avatarUrl,
      timestamp: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
      aiCredibilityScore: 95,
      aiAnalysis: {
        credibilityScore: 95,
        redFlags: [],
        supportingEvidence: [
          "Verified Red Cross dispatch log #RC-8812",
          "Municipal Emergency Management Twitter announcement matches details",
          "Civic Arena official website banner active",
        ],
        reasoning: "Corroborated across multiple primary emergency management sources including municipal emergency services and Red Cross staging coordinators.",
        badge: "Verified",
        analyzedAt: new Date(Date.now() - 1000 * 60 * 89).toISOString(),
        modelUsed: "gemini-3.8-flash",
      },
      credibilityBadge: "Verified",
      helpfulVotes: 64,
      misleadingVotes: 1,
      totalVotes: 65,
      status: "Active",
    },
    {
      claimId: "claim_wildfire_04",
      title: "Voluntary Evacuation Warning for Pine Crest Ridge and West Creek",
      description: "Rapid shifting winds from the Ridge Fire prompted Sheriff Department to advise residents north of Highway 4 to prepare go-bags.",
      imageUrl: "https://images.unsplash.com/photo-1542385151-efd9000785a0?w=800&auto=format&fit=crop&q=80",
      location: "El Dorado Hills, CA",
      latitude: 38.6857,
      longitude: -121.0822,
      crisisType: "Wildfire",
      userId: "user_sarah_m",
      username: "SarahM_CitizenReporter",
      userAvatar: seedUsers[1].avatarUrl,
      timestamp: new Date(Date.now() - 1000 * 60 * 140).toISOString(),
      aiCredibilityScore: 88,
      aiAnalysis: {
        credibilityScore: 88,
        redFlags: ["Some social posts exaggerating voluntary notice as mandatory immediate flee order"],
        supportingEvidence: [
          "CAL FIRE incident map updated at 03:00 showing Zone 4 advisory",
          "Sheriff Nixle alert issued 2 hours ago",
        ],
        reasoning: "Notice is genuine as an advisory/warning stage. Community members should note this is currently a voluntary 'Set' notice, not a mandatory evacuation order.",
        badge: "Verified",
        analyzedAt: new Date(Date.now() - 1000 * 60 * 138).toISOString(),
        modelUsed: "gemini-3.8-flash",
      },
      credibilityBadge: "Verified",
      helpfulVotes: 52,
      misleadingVotes: 3,
      totalVotes: 55,
      status: "Active",
    },
    {
      claimId: "claim_chem_05",
      title: "Hazardous Chemical Cloud Headed Towards North Suburbs Following Tanker Derailment",
      description: "Rumors alleging chlorine gas plume will reach residential neighborhoods within 30 minutes; advising residents to seal windows with tape.",
      imageUrl: "https://images.unsplash.com/photo-1584036561566-baf8f5f1b144?w=800&auto=format&fit=crop&q=80",
      location: "North Industrial Rail Corridor",
      latitude: 41.8781,
      longitude: -87.6298,
      crisisType: "Industrial Disaster",
      userId: "user_emergency_desk",
      username: "EmergencyResponseDesk",
      userAvatar: seedUsers[0].avatarUrl,
      timestamp: new Date(Date.now() - 1000 * 60 * 200).toISOString(),
      aiCredibilityScore: 45,
      aiAnalysis: {
        credibilityScore: 45,
        redFlags: [
          "Derailed cargo was non-hazardous dry grain, not chlorine or toxic gas",
          "Unattributed audio memo creating artificial grocery and fuel runs",
        ],
        supportingEvidence: ["Hazmat Incident Commander statement confirming zero chemical leak at scene"],
        reasoning: "The train incident occurred but manifest records confirm grain cars only. Fire Hazmat unit detected zero atmospheric contaminants.",
        badge: "Unverified",
        analyzedAt: new Date(Date.now() - 1000 * 60 * 198).toISOString(),
        modelUsed: "gemini-3.8-flash",
      },
      credibilityBadge: "False",
      helpfulVotes: 5,
      misleadingVotes: 31,
      totalVotes: 36,
      status: "Active",
      spreadRate: "510 shares/hr",
      isTrendingFalse: true,
    },
    {
      claimId: "claim_clinic_06",
      title: "Mobile Emergency Triage Clinic Set Up at St. Jude Community Center",
      description: "Field doctors providing free tetanus shots, burn dressings, prescription refills, and oxygen support for displaced residents.",
      imageUrl: "https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=800&auto=format&fit=crop&q=80",
      location: "Eastside Community District",
      latitude: 32.7157,
      longitude: -117.1611,
      crisisType: "Mass Casualty",
      userId: "user_redcross_vol",
      username: "RedCross_FieldTeam",
      userAvatar: seedUsers[2].avatarUrl,
      timestamp: new Date(Date.now() - 1000 * 60 * 320).toISOString(),
      aiCredibilityScore: 92,
      aiAnalysis: {
        credibilityScore: 92,
        redFlags: [],
        supportingEvidence: ["St. Jude Parish outreach coordinator confirmed operations", "County Health Dept mobile van on-site"],
        reasoning: "Clinic is verified active with licensed medical volunteers and supplies present.",
        badge: "Verified",
        analyzedAt: new Date(Date.now() - 1000 * 60 * 318).toISOString(),
        modelUsed: "gemini-3.8-flash",
      },
      credibilityBadge: "Verified",
      helpfulVotes: 41,
      misleadingVotes: 0,
      totalVotes: 41,
      status: "Active",
    },
  ];

  initialClaims.forEach((c) => claims.set(c.claimId, c));
}

seedInitialData();

// Helper: Auto-detect Crisis Type from text if not provided
function autoDetectCrisisType(text: string): CrisisType {
  const lower = text.toLowerCase();
  if (lower.includes("flood") || lower.includes("water level") || lower.includes("dam") || lower.includes("river rise") || lower.includes("submerged")) return "Flood";
  if (lower.includes("earthquake") || lower.includes("tremor") || lower.includes("aftershock") || lower.includes("richter") || lower.includes("seismic")) return "Earthquake";
  if (lower.includes("fire") || lower.includes("wildfire") || lower.includes("smoke") || lower.includes("burn") || lower.includes("blaze")) return "Wildfire";
  if (lower.includes("virus") || lower.includes("pandemic") || lower.includes("outbreak") || lower.includes("vaccine") || lower.includes("quarantine")) return "Pandemic";
  if (lower.includes("hurricane") || lower.includes("cyclone") || lower.includes("storm surge") || lower.includes("typhoon")) return "Hurricane";
  if (lower.includes("chemical") || lower.includes("gas leak") || lower.includes("explosion") || lower.includes("plant") || lower.includes("derailment")) return "Industrial Disaster";
  if (lower.includes("casualty") || lower.includes("triage") || lower.includes("injuries") || lower.includes("active threat") || lower.includes("stampede")) return "Mass Casualty";
  if (lower.includes("tornado") || lower.includes("storm") || lower.includes("blizzard") || lower.includes("gale") || lower.includes("hail")) return "Severe Storm";
  return "General Emergency";
}

// AI Credibility Analysis using Gemini (or Claude if key is provided)
async function analyzeClaimWithAI(
  title: string,
  description: string,
  location: string = "Emergency Zone",
  crisisType: string = "General Emergency"
): Promise<AIAnalysis> {
  const systemPrompt = `You are a crisis misinformation analyst. Analyze the following claim reported during an active emergency and provide:
1. Credibility score (0-100, where 100 is definitely verified true, 0 is definitely false/hoax)
2. Key red flags (if any, e.g. recycled footage, lack of verifiable municipal source, emotional panic triggers)
3. Supporting evidence patterns (corroborating emergency services, official dispatch consistency)
4. Brief reasoning (2-3 sentences explaining the fact-check determination)
Respond ONLY in valid JSON format with keys:
"credibilityScore": number,
"redFlags": string[],
"supportingEvidence": string[],
"reasoning": string,
"badge": "Likely False" | "Unverified" | "Likely True"`;

  const userPrompt = `Analyze this claim from ${location} during ${crisisType}: "${title}" - "${description}"`;

  // 1. Try Claude if ANTHROPIC_API_KEY is configured
  if (process.env.ANTHROPIC_API_KEY) {
    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-3-5-sonnet-20241022",
          max_tokens: 1000,
          system: systemPrompt,
          messages: [{ role: "user", content: userPrompt }],
        }),
      });
      if (response.ok) {
        const json = await response.json();
        const contentText = json.content?.[0]?.text || "";
        const parsed = parseAIResponse(contentText, "Claude 3.5 Sonnet");
        if (parsed) return parsed;
      }
    } catch (claudeErr) {
      console.warn("Claude API call failed, falling back to Gemini:", claudeErr);
    }
  }

  // 2. Try Gemini using modern @google/genai SDK
  const ai = getGeminiClient();
  if (ai) {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: `${systemPrompt}\n\nUser Request: ${userPrompt}`,
        config: {
          responseMimeType: "application/json",
        },
      });
      const responseText = response.text || "";
      const parsed = parseAIResponse(responseText, "gemini-3.8-flash");
      if (parsed) return parsed;
    } catch (geminiErr) {
      console.warn("Gemini API call failed, falling back to heuristic fact-check:", geminiErr);
    }
  }

  // 3. Fallback Heuristic Misinformation Model (deterministic safeguard)
  return generateHeuristicAnalysis(title, description, crisisType);
}

function parseAIResponse(text: string, modelName: string): AIAnalysis | null {
  try {
    // Extract JSON block if wrapped in markdown
    let clean = text.trim();
    if (clean.startsWith("```json")) {
      clean = clean.replace(/^```json/, "").replace(/```$/, "").trim();
    } else if (clean.startsWith("```")) {
      clean = clean.replace(/^```/, "").replace(/```$/, "").trim();
    }
    const data = JSON.parse(clean);

    const score = Math.max(0, Math.min(100, Number(data.credibilityScore) || 50));
    let badge: CredibilityBadge = "Unverified";
    if (score >= 70 || data.badge === "Likely True") {
      badge = "Verified";
    } else if (score <= 35 || data.badge === "Likely False") {
      badge = "False";
    }

    return {
      credibilityScore: score,
      redFlags: Array.isArray(data.redFlags) ? data.redFlags : ["Requires on-the-ground verification"],
      supportingEvidence: Array.isArray(data.supportingEvidence) ? data.supportingEvidence : [],
      reasoning: String(data.reasoning || "Analyzed by CrisisVerify automated fact-checking engine."),
      badge,
      analyzedAt: new Date().toISOString(),
      modelUsed: modelName,
    };
  } catch (err) {
    console.warn("JSON parse error on AI response:", err, text);
    return null;
  }
}

function generateHeuristicAnalysis(title: string, description: string, crisisType: string): AIAnalysis {
  const combined = (title + " " + description).toLowerCase();
  const sensationalTerms = ["shocking", "hiding the truth", "share before deleted", "death toll coverup", "flee immediately", "martial law", "secret weapon", "fake news"];
  const verifiedTerms = ["officials announced", "evacuation center", "red cross", "fire department", "national weather service", "hospital", "police dispatch", "shelter open"];

  let score = 50;
  const redFlags: string[] = [];
  const supportingEvidence: string[] = [];

  for (const term of sensationalTerms) {
    if (combined.includes(term)) {
      score -= 15;
      redFlags.push(`Sensational phrasing detected: "${term}"`);
    }
  }

  for (const term of verifiedTerms) {
    if (combined.includes(term)) {
      score += 15;
      supportingEvidence.push(`References recognized emergency terminology: "${term}"`);
    }
  }

  if (redFlags.length === 0 && score < 50) {
    redFlags.push("Uncorroborated single-source report during emergency phase");
  }

  score = Math.max(10, Math.min(95, score));
  const badge: CredibilityBadge = score >= 70 ? "Verified" : score <= 35 ? "False" : "Unverified";

  return {
    credibilityScore: score,
    redFlags: redFlags.length > 0 ? redFlags : ["Pending secondary official agency confirmation"],
    supportingEvidence,
    reasoning: score <= 35
      ? "Uses alarmist language without verifiable municipal citations. High probability of rumor spread."
      : score >= 70
      ? "Corresponds with standard emergency coordination protocols and verified service points."
      : "Information is currently mixed or pending field observer confirmation. Community voting requested.",
    badge,
    analyzedAt: new Date().toISOString(),
    modelUsed: "CrisisVerify Heuristic Engine",
  };
}

// Recalculate badge based on community votes and AI analysis
function updateClaimBadge(claim: Claim) {
  const { helpfulVotes, misleadingVotes, totalVotes, aiCredibilityScore } = claim;

  if (totalVotes === 0) {
    if (aiCredibilityScore >= 70) claim.credibilityBadge = "Verified";
    else if (aiCredibilityScore <= 35) claim.credibilityBadge = "False";
    else claim.credibilityBadge = "Unverified";
    return;
  }

  const helpfulRatio = helpfulVotes / totalVotes;
  const misleadingRatio = misleadingVotes / totalVotes;

  // 60%+ threshold as defined in spec
  if (totalVotes >= 3) {
    if (helpfulRatio >= 0.6) {
      claim.credibilityBadge = "Verified";
    } else if (misleadingRatio >= 0.6) {
      claim.credibilityBadge = "False";
      claim.isTrendingFalse = true;
    } else {
      claim.credibilityBadge = "Unverified";
    }
  } else {
    // Low vote count: weight AI score + preliminary votes
    if (aiCredibilityScore >= 70 && misleadingVotes === 0) {
      claim.credibilityBadge = "Verified";
    } else if (aiCredibilityScore <= 35 || misleadingRatio >= 0.6) {
      claim.credibilityBadge = "False";
    } else {
      claim.credibilityBadge = "Unverified";
    }
  }
}

// -------------------------------------------------------------
// API ENDPOINTS
// -------------------------------------------------------------

// SSE Real-time Feed stream endpoint
app.get("/api/events", (req: Request, res: Response) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  // Send initial connected ping
  res.write(`event: connected\ndata: ${JSON.stringify({ message: "Connected to CrisisVerify Real-Time Stream", timestamp: new Date().toISOString() })}\n\n`);

  sseClients.push(res);

  req.on("close", () => {
    const idx = sseClients.indexOf(res);
    if (idx !== -1) sseClients.splice(idx, 1);
  });
});

// GET /api/claims - Fetch all claims with filtering & sorting
app.get("/api/claims", (req: Request, res: Response) => {
  const {
    crisisType,
    status = "Active",
    credibilityBadge,
    sortBy = "newest",
    timeRange = "all",
    search = "",
    page = "1",
    limit = "50",
  } = req.query;

  let all = Array.from(claims.values());

  // Filter by status
  if (status && status !== "All") {
    all = all.filter((c) => c.status === status);
  }

  // Filter by crisisType
  if (crisisType && crisisType !== "All") {
    all = all.filter((c) => c.crisisType.toLowerCase() === String(crisisType).toLowerCase());
  }

  // Filter by credibilityBadge
  if (credibilityBadge && credibilityBadge !== "All") {
    all = all.filter((c) => c.credibilityBadge.toLowerCase() === String(credibilityBadge).toLowerCase());
  }

  // Filter by timeRange
  if (timeRange === "24h") {
    const cutoff = Date.now() - 24 * 60 * 60 * 1000;
    all = all.filter((c) => new Date(c.timestamp).getTime() >= cutoff);
  } else if (timeRange === "3d") {
    const cutoff = Date.now() - 3 * 24 * 60 * 60 * 1000;
    all = all.filter((c) => new Date(c.timestamp).getTime() >= cutoff);
  } else if (timeRange === "7d") {
    const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
    all = all.filter((c) => new Date(c.timestamp).getTime() >= cutoff);
  }

  // Filter by search query
  if (search && typeof search === "string" && search.trim().length > 0) {
    const q = search.trim().toLowerCase();
    all = all.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q) ||
        (c.location && c.location.toLowerCase().includes(q))
    );
  }

  // Sort
  if (sortBy === "votes") {
    all.sort((a, b) => b.totalVotes - a.totalVotes);
  } else if (sortBy === "misleading") {
    all.sort((a, b) => b.misleadingVotes - a.misleadingVotes);
  } else if (sortBy === "verified") {
    all.sort((a, b) => b.helpfulVotes - a.helpfulVotes);
  } else {
    // default newest
    all.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  const pageNum = parseInt(String(page), 10) || 1;
  const limitNum = parseInt(String(limit), 10) || 50;
  const startIndex = (pageNum - 1) * limitNum;
  const paginated = all.slice(startIndex, startIndex + limitNum);

  res.json({
    claims: paginated,
    total: all.length,
    page: pageNum,
    limit: limitNum,
  });
});

// GET /api/claims/:claimId - Single claim detail
app.get("/api/claims/:claimId", (req: Request, res: Response) => {
  const { claimId } = req.params;
  const claim = claims.get(claimId);
  if (!claim) {
    res.status(404).json({ error: "Claim not found" });
    return;
  }
  res.json(claim);
});

// POST /api/claims - Submit new claim with AI credibility analysis
app.post("/api/claims", async (req: Request, res: Response) => {
  try {
    const {
      title,
      description,
      imageUrl,
      location,
      latitude,
      longitude,
      crisisType: userCrisisType,
      userId = "anon_user",
      username = "Anonymous Reporter",
    } = req.body;

    if (!title || !description) {
      res.status(400).json({ error: "Title and description are required" });
      return;
    }

    const detectedCrisisType: CrisisType =
      userCrisisType && userCrisisType !== "Auto-detect"
        ? userCrisisType
        : autoDetectCrisisType(`${title} ${description}`);

    // Call AI Misinformation Analyst
    const aiAnalysis = await analyzeClaimWithAI(
      title,
      description,
      location || "Emergency Zone",
      detectedCrisisType
    );

    const claimId = `claim_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const user = users.get(userId);

    const newClaim: Claim = {
      claimId,
      title: title.trim(),
      description: description.trim(),
      imageUrl: imageUrl || undefined,
      location: location || undefined,
      latitude: typeof latitude === "number" ? latitude : undefined,
      longitude: typeof longitude === "number" ? longitude : undefined,
      crisisType: detectedCrisisType,
      userId,
      username: user ? user.username : username,
      userAvatar: user?.avatarUrl,
      timestamp: new Date().toISOString(),
      aiCredibilityScore: aiAnalysis.credibilityScore,
      aiAnalysis,
      credibilityBadge: aiAnalysis.badge,
      helpfulVotes: 0,
      misleadingVotes: 0,
      totalVotes: 0,
      status: "Active",
      spreadRate: aiAnalysis.badge === "False" ? "Rapid spread" : undefined,
      isTrendingFalse: aiAnalysis.badge === "False",
    };

    claims.set(claimId, newClaim);

    // Update user submission counter if user exists
    if (user) {
      user.submissionCount += 1;
      users.set(user.userId, user);
    }

    // Broadcast real-time claim created event to all connected clients
    broadcastSSE("claim_created", newClaim);

    res.status(201).json({
      claim: newClaim,
      claimId: newClaim.claimId,
      credibilityScore: newClaim.aiCredibilityScore,
      credibilityBadge: newClaim.credibilityBadge,
    });
  } catch (error: any) {
    console.error("Error creating claim:", error);
    res.status(500).json({ error: error.message || "Failed to submit claim" });
  }
});

// POST /api/votes - Submit vote on claim
app.post("/api/votes", (req: Request, res: Response) => {
  const { claimId, userId, voteType } = req.body;

  if (!claimId || !userId || !["helpful", "misleading"].includes(voteType)) {
    res.status(400).json({ error: "Invalid vote parameters" });
    return;
  }

  const claim = claims.get(claimId);
  if (!claim) {
    res.status(404).json({ error: "Claim not found" });
    return;
  }

  const voteKey = `${claimId}_${userId}`;
  const existingVote = votes.get(voteKey);

  if (existingVote) {
    if (existingVote.voteType === voteType) {
      // Toggle vote off (retract vote)
      if (voteType === "helpful") claim.helpfulVotes = Math.max(0, claim.helpfulVotes - 1);
      else claim.misleadingVotes = Math.max(0, claim.misleadingVotes - 1);
      claim.totalVotes = Math.max(0, claim.totalVotes - 1);
      votes.delete(voteKey);

      updateClaimBadge(claim);
      broadcastSSE("vote_updated", { claimId, claim, userVote: null });
      res.json({ claim, userVote: null });
      return;
    } else {
      // Change vote
      if (voteType === "helpful") {
        claim.helpfulVotes += 1;
        claim.misleadingVotes = Math.max(0, claim.misleadingVotes - 1);
      } else {
        claim.misleadingVotes += 1;
        claim.helpfulVotes = Math.max(0, claim.helpfulVotes - 1);
      }
      existingVote.voteType = voteType;
      existingVote.timestamp = new Date().toISOString();
      votes.set(voteKey, existingVote);
    }
  } else {
    // New vote
    const newVote: Vote = {
      voteId: `vote_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      claimId,
      userId,
      voteType,
      timestamp: new Date().toISOString(),
    };
    votes.set(voteKey, newVote);

    if (voteType === "helpful") claim.helpfulVotes += 1;
    else claim.misleadingVotes += 1;
    claim.totalVotes += 1;

    // Increment voter reputation slightly for civic fact checking
    const voter = users.get(userId);
    if (voter) {
      voter.reputation += 1;
      users.set(userId, voter);
    }
  }

  // Recalculate badge & spread flags
  updateClaimBadge(claim);

  // If claim gets verified with strong consensus, reward author reputation
  if (claim.credibilityBadge === "Verified") {
    const author = users.get(claim.userId);
    if (author) {
      author.reputation += 3;
      users.set(author.userId, author);
    }
  }

  claims.set(claimId, claim);
  broadcastSSE("vote_updated", { claimId, claim, userVote: voteType });

  res.json({
    claim,
    userVote: voteType,
    credibilityBadge: claim.credibilityBadge,
  });
});

// GET /api/votes/user/:userId - Get all user votes to persist active vote state in UI
app.get("/api/votes/user/:userId", (req: Request, res: Response) => {
  const { userId } = req.params;
  const userVotes: Record<string, "helpful" | "misleading"> = {};

  for (const [key, vote] of votes.entries()) {
    if (vote.userId === userId) {
      userVotes[vote.claimId] = vote.voteType;
    }
  }

  res.json(userVotes);
});

// GET /api/trending - Get top 5 false claims spreading fastest
app.get("/api/trending", (req: Request, res: Response) => {
  const falseClaims = Array.from(claims.values()).filter(
    (c) => c.credibilityBadge === "False" || c.aiCredibilityScore <= 35
  );

  // Score spread velocity: misleadingVotes * 10 + totalVotes * 2 + (100 - aiScore)
  const scored = falseClaims.map((c) => {
    const velocity = (c.misleadingVotes * 12) + (c.totalVotes * 3) + (100 - c.aiCredibilityScore);
    return {
      ...c,
      spreadVelocity: velocity,
      spreadRate: c.spreadRate || `${Math.max(180, Math.round(velocity * 7))} shares/hr`,
    } as TrendingClaim;
  });

  scored.sort((a, b) => b.spreadVelocity - a.spreadVelocity);
  res.json(scored.slice(0, 5));
});

// Authentication endpoints
app.post("/api/auth/signup", (req: Request, res: Response) => {
  const { email, password, username } = req.body;
  if (!username) {
    res.status(400).json({ error: "Username is required" });
    return;
  }

  const userId = `user_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const newUser: User = {
    userId,
    email: email || `${username.toLowerCase().replace(/\s+/g, "_")}@crisisverify.local`,
    username: username.trim(),
    avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(username)}`,
    isAnonymous: false,
    createdAt: new Date().toISOString(),
    submissionCount: 0,
    reputation: 15,
    badgeTitle: "Community Reporter",
  };

  users.set(userId, newUser);
  res.status(201).json({ user: newUser, token: `token_${userId}` });
});

app.post("/api/auth/login", (req: Request, res: Response) => {
  const { email, username } = req.body;
  // Look up existing or auto-create friendly session
  let foundUser = Array.from(users.values()).find(
    (u) => (email && u.email === email) || (username && u.username.toLowerCase() === username.toLowerCase())
  );

  if (!foundUser && username) {
    const userId = `user_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    foundUser = {
      userId,
      email: email || `${username.toLowerCase().replace(/\s+/g, "_")}@crisisverify.local`,
      username: username.trim(),
      avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(username)}`,
      isAnonymous: false,
      createdAt: new Date().toISOString(),
      submissionCount: 0,
      reputation: 20,
      badgeTitle: "Community Reporter",
    };
    users.set(userId, foundUser);
  }

  if (foundUser) {
    res.json({ user: foundUser, token: `token_${foundUser.userId}` });
  } else {
    res.status(404).json({ error: "User not found" });
  }
});

app.post("/api/auth/guest", (req: Request, res: Response) => {
  const guestNum = Math.floor(1000 + Math.random() * 9000);
  const userId = `anon_${Date.now()}_${guestNum}`;
  const guestUser: User = {
    userId,
    username: `Citizen Responder #${guestNum}`,
    avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${userId}`,
    isAnonymous: true,
    createdAt: new Date().toISOString(),
    submissionCount: 0,
    reputation: 10,
    badgeTitle: "Anonymous Responder",
  };
  users.set(userId, guestUser);
  res.json({ user: guestUser, token: `token_${userId}` });
});

app.get("/api/auth/user/:userId", (req: Request, res: Response) => {
  const { userId } = req.params;
  const user = users.get(userId);
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  // Count user submissions
  const userClaims = Array.from(claims.values()).filter((c) => c.userId === userId);
  res.json({
    ...user,
    submissionCount: userClaims.length,
    recentClaims: userClaims.slice(0, 5),
  });
});

// -------------------------------------------------------------
// VITE SPA MIDDLEWARE / STATIC ASSETS
// -------------------------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`CrisisVerify Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
