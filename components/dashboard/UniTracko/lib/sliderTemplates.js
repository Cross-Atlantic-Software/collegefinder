// 5 slider templates per theme x 25 themes = 125 templates.
// Each is expanded against SLIDER_CONTEXTS (40 contexts) by the generator,
// producing 200 unique scored items per theme = 5000 slider questions total.
// {{context}} gets substituted with a phrase from SLIDER_CONTEXTS.

const SLIDER_TEMPLATES = [
  // ---- Think ----
  { theme: "evidence", templates: [
    "When it comes to {{context}}, I want solid proof before I make up my mind.",
    "I break {{context}} into smaller, logical pieces instead of reacting on impulse.",
    "Before trusting an opinion about {{context}}, I look for actual evidence.",
    "I feel uneasy moving forward on {{context}} without data to back it up.",
    "I naturally question assumptions when it comes to {{context}}.",
  ]},
  { theme: "ideaspark", templates: [
    "Random fresh ideas about {{context}} pop into my head without trying.",
    "I get bored doing {{context}} the same way every time and look for a new angle.",
    "I enjoy connecting unrelated ideas when I'm thinking about {{context}}.",
    "I'm usually the one suggesting an unconventional approach to {{context}}.",
    "I find myself imagining alternatives to the usual way of handling {{context}}.",
  ]},
  { theme: "deepthink", templates: [
    "I'd rather think through {{context}} alone before discussing it with anyone.",
    "I can sit with {{context}} for a long time without rushing to act.",
    "I prefer quiet reflection over quick reaction when it comes to {{context}}.",
    "I notice details about {{context}} that others move past too quickly.",
    "I need real thinking time before I can speak confidently about {{context}}.",
  ]},
  { theme: "chessplayer", templates: [
    "Before committing to {{context}}, I think through what could go wrong.",
    "I map out two or three steps ahead when dealing with {{context}}.",
    "I weigh multiple options carefully before acting on {{context}}.",
    "I think about the risk involved in {{context}} more than most people do.",
    "I plan for likely complications before they show up in {{context}}.",
  ]},
  { theme: "visionary", templates: [
    "I often imagine how {{context}} could look completely different in the future.",
    "I get more excited talking about where {{context}} is headed than about today's version of it.",
    "I think about long-term possibilities for {{context}} more than most people my age.",
    "I find myself describing a future version of {{context}} that doesn't exist yet.",
    "I'm drawn to big-picture thinking about {{context}} rather than the immediate details.",
  ]},

  // ---- Drive ----
  { theme: "achiever", templates: [
    "A day where I make no progress on {{context}} feels wasted to me.",
    "I keep track of what I've actually finished related to {{context}}, not just what's pending.",
    "I feel restless until {{context}} is actually done, not just planned.",
    "I push to complete {{context}} even when no one is checking on me.",
    "Finishing {{context}} matters more to me than doing it perfectly.",
  ]},
  { theme: "laser", templates: [
    "Once I start on {{context}}, distractions barely register until it's done.",
    "I can focus on {{context}} for hours without switching to something else.",
    "I get irritated by interruptions while I'm deep into {{context}}.",
    "I protect my time fiercely when I'm working through {{context}}.",
    "I lose track of everything else once I'm absorbed in {{context}}.",
  ]},
  { theme: "structure", templates: [
    "I feel calmer about {{context}} when I have a clear plan or schedule for it.",
    "I make checklists or timetables before tackling {{context}}, and mostly follow them.",
    "Chaos around {{context}} drains me; order energises me.",
    "I like having a defined process before I start on {{context}}.",
    "I organise {{context}} step by step rather than diving in randomly.",
  ]},
  { theme: "ownership", templates: [
    "When {{context}} goes wrong, I look at my own role in it before blaming others.",
    "I make sure {{context}} actually gets finished, even if it isn't officially my job.",
    "I take responsibility for {{context}} even when it would be easy to pass the blame.",
    "I feel personally accountable for how {{context}} turns out.",
    "I follow through on {{context}} because I said I would, not because someone's watching.",
  ]},
  { theme: "fixer", templates: [
    "When something about {{context}} is broken or messy, I want to repair it.",
    "I enjoy untangling a problem in {{context}} more than starting something new.",
    "I notice exactly what's gone wrong with {{context}} before others do.",
    "I'm drawn toward fixing {{context}} rather than walking past it.",
    "I get satisfaction from restoring order to {{context}} once it's fallen apart.",
  ]},

  // ---- Connect ----
  { theme: "heartreader", templates: [
    "I can sense how someone really feels about {{context}}, even if they don't say it.",
    "Other people's emotions around {{context}} affect my own mood.",
    "I notice the unspoken feelings behind {{context}} before anyone points them out.",
    "I tune into people's emotional state during {{context}} more than most.",
    "I pick up on tension or discomfort around {{context}} quickly.",
  ]},
  { theme: "grower", templates: [
    "I notice someone's potential in {{context}} before they notice it themselves.",
    "I get satisfaction from helping someone improve at {{context}}, even slowly.",
    "I look for ways to help others grow through {{context}}.",
    "I naturally end up coaching or guiding people through {{context}}.",
    "I invest time helping others get better at {{context}}, even without being asked.",
  ]},
  { theme: "depthbond", templates: [
    "I'd rather go deep on {{context}} with one close person than discuss it with many.",
    "I invest heavily in a few key relationships when {{context}} matters to me.",
    "I prefer a small circle of trust when it comes to {{context}}.",
    "I open up about {{context}} only with people I'm genuinely close to.",
    "Quality over quantity describes how I handle relationships during {{context}}.",
  ]},
  { theme: "peacemaker", templates: [
    "When tension comes up around {{context}}, I instinctively look for common ground.",
    "I try to de-escalate conflict whenever {{context}} causes disagreement.",
    "I find myself mediating when people clash over {{context}}.",
    "I look for what both sides actually agree on during disputes about {{context}}.",
    "I avoid taking sides and aim for fairness when {{context}} gets tense.",
  ]},
  { theme: "welcomeall", templates: [
    "I notice when someone feels left out during {{context}}, and it bothers me.",
    "I go out of my way to include quieter people in {{context}}.",
    "I make sure no one feels like an outsider during {{context}}.",
    "I actively pull in people who might otherwise be ignored during {{context}}.",
    "I check that everyone feels welcome before {{context}} moves forward.",
  ]},

  // ---- Lead ----
  { theme: "igniter", templates: [
    "I'd rather start {{context}} imperfectly than keep planning it forever.",
    "When a group stalls on {{context}}, I'm usually the one who says 'let's just begin.'",
    "I push things into motion on {{context}} instead of waiting for the perfect moment.",
    "I get impatient when {{context}} stays in the talking stage too long.",
    "I take the first concrete step on {{context}} before anyone else does.",
  ]},
  { theme: "stageowner", templates: [
    "I'm comfortable taking charge of {{context}} when no one else steps up.",
    "I naturally end up directing {{context}}, even without being asked.",
    "I make the final call on {{context}} when the group can't decide.",
    "I'm at ease being the one responsible for how {{context}} turns out.",
    "I step into a leadership role during {{context}} almost without thinking.",
  ]},
  { theme: "storyteller", templates: [
    "People ask me to re-explain {{context}} because I make it clearer.",
    "I use stories or examples to make {{context}} land with others.",
    "I can make {{context}} interesting to people who weren't paying attention before.",
    "I think about how to frame {{context}} so it actually sticks with people.",
    "I enjoy explaining {{context}} in a way that changes how people see it.",
  ]},
  { theme: "connector", templates: [
    "I build rapport quickly with new people I meet through {{context}}.",
    "I know people across different groups who could help with {{context}}.",
    "I enjoy introducing people to each other during {{context}}.",
    "I widen my network naturally whenever {{context}} brings new people in.",
    "I'm the one who brings in outside help or contacts for {{context}}.",
  ]},
  { theme: "amplifier", templates: [
    "When {{context}} is already good, I still look for ways to make it excellent.",
    "I'd rather sharpen what's working in {{context}} than fix what's broken.",
    "I push {{context}} past 'good enough' even when others are satisfied.",
    "I notice the difference between okay and outstanding in {{context}}.",
    "I raise the bar on {{context}} for myself and the people around me.",
  ]},

  // ---- Grow ----
  { theme: "growthseeker", templates: [
    "Getting better at {{context}} excites me more than the result itself.",
    "I'd choose a harder version of {{context}} over an easy one I've already mastered.",
    "I track my own improvement in {{context}} more than I track the outcome.",
    "I enjoy the struggle of {{context}} because it means I'm growing.",
    "I feel most alive when {{context}} is pushing me past what I could do before.",
  ]},
  { theme: "collector", templates: [
    "I save articles, videos, or notes about {{context}} far more than I revisit them.",
    "I enjoy gathering facts and information about {{context}}, even without an immediate use.",
    "I end up with more resources on {{context}} than I ever get through.",
    "I collect knowledge about {{context}} just because it interests me.",
    "I keep notes on {{context}} 'for later' more than anyone I know.",
  ]},
  { theme: "flowstate", templates: [
    "A sudden change to {{context}} doesn't throw off the rest of my day.",
    "I adjust quickly when {{context}} shifts unexpectedly.",
    "I stay productive on {{context}} even when the plan changes midway.",
    "I handle uncertainty around {{context}} better than most people I know.",
    "I bounce back fast when {{context}} doesn't go as expected.",
  ]},
  { theme: "conviction", templates: [
    "I'll say what I actually think about {{context}}, even if it's unpopular.",
    "My sense of right and wrong around {{context}} stays steady under pressure.",
    "I won't compromise my values on {{context}} just to fit in.",
    "I stand by my position on {{context}} even when it costs me socially.",
    "I trust my own judgment on {{context}} even when others disagree.",
  ]},
  { theme: "legacy", templates: [
    "I think about how {{context}} will be remembered, not just how it looks today.",
    "I want {{context}} to matter beyond just me, even years from now.",
    "I care about the lasting impact of {{context}}, not just the immediate result.",
    "I think about the bigger purpose behind {{context}} more than most people my age.",
    "I want my effort on {{context}} to outlast the moment it happens in.",
  ]},
];

export { SLIDER_TEMPLATES };
