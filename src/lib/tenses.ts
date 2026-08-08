/**
 * Static tense reference used by /tenses. Written for an Urdu-speaking learner:
 * every rule has a Roman Urdu "why" and a wrong -> right pair taken from the
 * mistakes Pakistani learners make most (will + 2nd form, did + 2nd form,
 * missing -s, missing -ing).
 *
 * Pure data, no server imports, so the page can stay a client component.
 */

export type TenseGroup = "present" | "past" | "future";

export type Example = {
  en: string;
  ur: string;
};

export type Mistake = {
  wrong: string;
  right: string;
  why: string;
};

export type Tense = {
  id: string;
  group: TenseGroup;
  name: string;
  urduName: string;
  short: string;
  formula: {
    positive: string;
    negative: string;
    question: string;
  };
  uses: string[];
  signals: string[];
  examples: Example[];
  mistakes: Mistake[];
};

export const GROUPS: {
  id: TenseGroup;
  label: string;
  urdu: string;
  emoji: string;
  accent: string;
}[] = [
  {
    id: "present",
    label: "Present",
    urdu: "Haal - jo abhi hota hai",
    emoji: "🟢",
    accent: "from-emerald-500 to-teal-500",
  },
  {
    id: "past",
    label: "Past",
    urdu: "Maazi - jo guzar chuka",
    emoji: "🟠",
    accent: "from-amber-500 to-orange-500",
  },
  {
    id: "future",
    label: "Future",
    urdu: "Mustaqbil - jo aage hoga",
    emoji: "🔵",
    accent: "from-indigo-500 to-violet-500",
  },
];

/** The five rules that fix most tense mistakes. Read these first. */
export const GOLDEN_RULES: Mistake[] = [
  {
    wrong: "I will worked tomorrow.",
    right: "I will work tomorrow.",
    why: "'will' ke baad hamesha verb ki PEHLI form aati hai (work, go, eat). Kabhi bhi worked / went / ate nahin.",
  },
  {
    wrong: "I did not went there.",
    right: "I did not go there.",
    why: "'did' aur 'did not' khud past bana dete hain. Iske baad verb ki pehli form hi aayegi.",
  },
  {
    wrong: "He go to office daily.",
    right: "He goes to office daily.",
    why: "Present Simple mein he / she / it ke saath verb par 's' lagta hai.",
  },
  {
    wrong: "I am go to the market.",
    right: "I am going to the market.",
    why: "am / is / are / was / were ke baad verb ke saath 'ing' zaroori hai.",
  },
  {
    wrong: "I have went to Lahore.",
    right: "I have gone to Lahore.",
    why: "have / has / had ke baad hamesha verb ki TEESRI form aati hai (gone, done, eaten).",
  },
];

export const TENSES: Tense[] = [
  // ---------------------------------------------------------------- present
  {
    id: "present-simple",
    group: "present",
    name: "Present Simple",
    urduName: "Rozana ka kaam",
    short: "I work / He works",
    formula: {
      positive: "Subject + verb (he/she/it → verb + s)",
      negative: "Subject + do not / does not + verb",
      question: "Do / Does + subject + verb ?",
    },
    uses: [
      "Rozana ki aadat ya routine ka kaam.",
      "Aisi baat jo hamesha sach hai.",
      "Timetable, schedule ya rules.",
    ],
    signals: ["every day", "always", "usually", "often", "never", "sometimes"],
    examples: [
      { en: "I go to the office every day.", ur: "Main rozana office jata hoon." },
      { en: "She speaks three languages.", ur: "Woh teen zabanein bolti hai." },
      { en: "He does not eat meat.", ur: "Woh gosht nahin khata." },
      { en: "Do you live in Lahore?", ur: "Kya aap Lahore mein rehte hain?" },
    ],
    mistakes: [
      {
        wrong: "My brother work in a bank.",
        right: "My brother works in a bank.",
        why: "'my brother' = he. He / she / it ke saath verb par 's' lagega.",
      },
      {
        wrong: "He does not goes to school.",
        right: "He does not go to school.",
        why: "'does' par pehle hi 's' aa gaya, isliye verb saada rahega.",
      },
    ],
  },
  {
    id: "present-continuous",
    group: "present",
    name: "Present Continuous",
    urduName: "Abhi is waqt ho raha hai",
    short: "I am working",
    formula: {
      positive: "Subject + am / is / are + verb + ing",
      negative: "Subject + am / is / are + not + verb + ing",
      question: "Am / Is / Are + subject + verb + ing ?",
    },
    uses: [
      "Jo kaam abhi, isi waqt ho raha hai.",
      "Aaj kal ka aarzi (temporary) kaam.",
      "Future ka pakka plan jiski date tay hai.",
    ],
    signals: ["now", "right now", "at the moment", "today", "these days"],
    examples: [
      { en: "I am eating right now.", ur: "Main abhi kha raha hoon." },
      {
        en: "He is working from home these days.",
        ur: "Woh aaj kal ghar se kaam kar raha hai.",
      },
      { en: "We are meeting Ali tomorrow.", ur: "Hum kal Ali se mil rahe hain." },
    ],
    mistakes: [
      {
        wrong: "I am go to the market.",
        right: "I am going to the market.",
        why: "am / is / are ke baad verb par 'ing' lagana zaroori hai.",
      },
      {
        wrong: "She working in a hospital now.",
        right: "She is working in a hospital now.",
        why: "'is' ko kabhi mat chhoro. Urdu mein 'hai' chhupa hota hai, English mein likhna parta hai.",
      },
    ],
  },
  {
    id: "present-perfect",
    group: "present",
    name: "Present Perfect",
    urduName: "Kaam ho chuka, waqt nahin bataya",
    short: "I have worked",
    formula: {
      positive: "Subject + have / has + 3rd form",
      negative: "Subject + have / has + not + 3rd form",
      question: "Have / Has + subject + 3rd form ?",
    },
    uses: [
      "Kaam mukammal ho chuka lekin waqt nahin bataya.",
      "Ab tak ka tajurba (zindagi mein kabhi kiya ya nahin).",
      "Aisa kaam jiska asar abhi bhi mojood hai.",
    ],
    signals: ["already", "just", "yet", "ever", "never", "since", "for"],
    examples: [
      { en: "I have finished my work.", ur: "Main apna kaam mukammal kar chuka hoon." },
      { en: "She has never seen snow.", ur: "Us ne kabhi barf nahin dekhi." },
      {
        en: "We have lived here for five years.",
        ur: "Hum paanch saal se yahan reh rahe hain.",
      },
    ],
    mistakes: [
      {
        wrong: "I have finished my work yesterday.",
        right: "I finished my work yesterday.",
        why: "Jahan waqt bata rahe ho (yesterday, last week, in 2020) wahan Past Simple aayega, Present Perfect nahin.",
      },
      {
        wrong: "He have completed the form.",
        right: "He has completed the form.",
        why: "He / she / it ke saath 'has' aata hai, 'have' nahin.",
      },
    ],
  },
  {
    id: "present-perfect-continuous",
    group: "present",
    name: "Present Perfect Continuous",
    urduName: "Pehle shuru hua, abhi tak jaari hai",
    short: "I have been working",
    formula: {
      positive: "Subject + have / has + been + verb + ing",
      negative: "Subject + have / has + not + been + verb + ing",
      question: "Have / Has + subject + been + verb + ing ?",
    },
    uses: [
      "Kaam pehle shuru hua aur ab tak chal raha hai.",
      "Batana ke kaam kitni der se ho raha hai.",
    ],
    signals: ["for", "since", "all day", "how long"],
    examples: [
      {
        en: "I have been waiting for two hours.",
        ur: "Main do ghantay se intezaar kar raha hoon.",
      },
      {
        en: "He has been studying since morning.",
        ur: "Woh subah se parh raha hai.",
      },
      {
        en: "How long have you been learning English?",
        ur: "Aap kab se English seekh rahe hain?",
      },
    ],
    mistakes: [
      {
        wrong: "I am waiting since two hours.",
        right: "I have been waiting for two hours.",
        why: "Arse ke liye 'for' (for two hours) aur waqt ke point ke liye 'since' (since 2 o'clock). Aur 'am waiting' ki jagah 'have been waiting'.",
      },
    ],
  },

  // ------------------------------------------------------------------- past
  {
    id: "past-simple",
    group: "past",
    name: "Past Simple",
    urduName: "Guzra hua mukammal kaam",
    short: "I worked / I went",
    formula: {
      positive: "Subject + 2nd form (worked, went, ate)",
      negative: "Subject + did not + 1st form",
      question: "Did + subject + 1st form ?",
    },
    uses: [
      "Guzray waqt ka mukammal kaam jiska waqt maloom hai.",
      "Guzri hui kahani ya waqiya sunana.",
    ],
    signals: ["yesterday", "last night", "last week", "ago", "in 2010", "then"],
    examples: [
      { en: "I went to Karachi last month.", ur: "Main pichle mahine Karachi gaya." },
      { en: "She called me yesterday.", ur: "Us ne mujhe kal call ki." },
      {
        en: "They did not come to the party.",
        ur: "Woh party mein nahin aaye.",
      },
      { en: "Did you finish your work?", ur: "Kya aap ne apna kaam mukammal kiya?" },
    ],
    mistakes: [
      {
        wrong: "I will worked yesterday.",
        right: "I worked yesterday.",
        why: "'will' sirf future ke liye hai. Past ke liye sirf verb ki doosri form (worked, went, ate) kaafi hai - 'will' bilkul mat lagao.",
      },
      {
        wrong: "Yesterday I will go to the bazaar.",
        right: "Yesterday I went to the bazaar.",
        why: "Jab 'yesterday' likha hai to poora jumla past mein hoga: go → went.",
      },
      {
        wrong: "I did not went there.",
        right: "I did not go there.",
        why: "'did not' pehle hi past bata raha hai, isliye verb apni pehli form mein wapas aa jata hai.",
      },
    ],
  },
  {
    id: "past-continuous",
    group: "past",
    name: "Past Continuous",
    urduName: "Us waqt kaam chal raha tha",
    short: "I was working",
    formula: {
      positive: "Subject + was / were + verb + ing",
      negative: "Subject + was / were + not + verb + ing",
      question: "Was / Were + subject + verb + ing ?",
    },
    uses: [
      "Guzray waqt mein kaam chal raha tha.",
      "Ek kaam chal raha tha ke doosra kaam ho gaya.",
      "Do kaam ek hi waqt mein ho rahe thay.",
    ],
    signals: ["while", "when", "at 8 o'clock yesterday", "all morning"],
    examples: [
      {
        en: "I was watching TV when you called.",
        ur: "Jab aap ne call ki tab main TV dekh raha tha.",
      },
      {
        en: "They were playing cricket at 5 pm.",
        ur: "Woh shaam 5 baje cricket khel rahe thay.",
      },
      { en: "She was not sleeping.", ur: "Woh so nahin rahi thi." },
    ],
    mistakes: [
      {
        wrong: "I was went to the market.",
        right: "I was going to the market.",
        why: "was / were ke baad hamesha 'ing' wali form aati hai, doosri form nahin.",
      },
      {
        wrong: "We was playing outside.",
        right: "We were playing outside.",
        why: "I / he / she / it ke saath 'was'. You / we / they ke saath 'were'.",
      },
    ],
  },
  {
    id: "past-perfect",
    group: "past",
    name: "Past Perfect",
    urduName: "Do purane kaam - jo pehle hua",
    short: "I had worked",
    formula: {
      positive: "Subject + had + 3rd form",
      negative: "Subject + had + not + 3rd form",
      question: "Had + subject + 3rd form ?",
    },
    uses: [
      "Guzray waqt ke do kaam mein se jo pehle hua us par 'had' lagta hai.",
      "Kisi purane waqt tak kaam mukammal ho chuka tha.",
    ],
    signals: ["before", "after", "already", "by the time"],
    examples: [
      {
        en: "The train had left before I reached the station.",
        ur: "Mere station pohanchne se pehle train ja chuki thi.",
      },
      {
        en: "She had finished her homework by 8 pm.",
        ur: "Us ne raat 8 bajay tak homework mukammal kar liya tha.",
      },
      {
        en: "I had never eaten sushi before that day.",
        ur: "Us din se pehle main ne kabhi sushi nahin khai thi.",
      },
    ],
    mistakes: [
      {
        wrong: "When I reached, the train already left.",
        right: "When I reached, the train had already left.",
        why: "Jo kaam pehle hua us par 'had + 3rd form' lagana zaroori hai.",
      },
      {
        wrong: "I had went home early.",
        right: "I had gone home early.",
        why: "'had' ke baad teesri form aati hai: went nahin, gone.",
      },
    ],
  },
  {
    id: "past-perfect-continuous",
    group: "past",
    name: "Past Perfect Continuous",
    urduName: "Us waqt tak kitni der se chal raha tha",
    short: "I had been working",
    formula: {
      positive: "Subject + had + been + verb + ing",
      negative: "Subject + had + not + been + verb + ing",
      question: "Had + subject + been + verb + ing ?",
    },
    uses: [
      "Guzray waqt ke kisi lamhe tak kaam kitni der se chal raha tha.",
      "Kisi purani baat ki wajah batana.",
    ],
    signals: ["for", "since", "before", "all day"],
    examples: [
      {
        en: "I had been working there for three years before I resigned.",
        ur: "Isteefa dene se pehle main teen saal se wahan kaam kar raha tha.",
      },
      {
        en: "He was tired because he had been driving all night.",
        ur: "Woh thaka hua tha kyunke woh saari raat gaari chala raha tha.",
      },
    ],
    mistakes: [
      {
        wrong: "I was working there since three years before I left.",
        right: "I had been working there for three years before I left.",
        why: "Purani baat se pehle wali baat ke liye 'had been + ing'. Aur arse ke liye 'for', 'since' nahin.",
      },
    ],
  },

  // ----------------------------------------------------------------- future
  {
    id: "future-simple",
    group: "future",
    name: "Future Simple",
    urduName: "Aage jo hoga",
    short: "I will work",
    formula: {
      positive: "Subject + will + 1st form",
      negative: "Subject + will not (won't) + 1st form",
      question: "Will + subject + 1st form ?",
    },
    uses: [
      "Aane wale waqt ka kaam.",
      "Abhi, bolte waqt kiya gaya faisla.",
      "Wada, pesh-kash ya madad ki baat.",
    ],
    signals: ["tomorrow", "next week", "soon", "later", "in 2030"],
    examples: [
      { en: "I will call you tomorrow.", ur: "Main aap ko kal call karunga." },
      { en: "She will not come today.", ur: "Woh aaj nahin aayegi." },
      { en: "Will you help me?", ur: "Kya aap meri madad karenge?" },
      {
        en: "I am going to buy a new phone next month.",
        ur: "Main agle mahine naya phone khareedne wala hoon. (pehle se socha hua plan)",
      },
    ],
    mistakes: [
      {
        wrong: "I will worked tomorrow.",
        right: "I will work tomorrow.",
        why: "'will' ke baad hamesha verb ki PEHLI form. Yeh sab se aam galti hai - isay yaad rakho.",
      },
      {
        wrong: "I will went to Islamabad next week.",
        right: "I will go to Islamabad next week.",
        why: "went past ki form hai. 'will' ke saath sirf 'go' aayega.",
      },
      {
        wrong: "He will comes at 5.",
        right: "He will come at 5.",
        why: "'will' ke baad verb par 's' bhi nahin lagta.",
      },
    ],
  },
  {
    id: "future-continuous",
    group: "future",
    name: "Future Continuous",
    urduName: "Us waqt kaam chal raha hoga",
    short: "I will be working",
    formula: {
      positive: "Subject + will be + verb + ing",
      negative: "Subject + will not be + verb + ing",
      question: "Will + subject + be + verb + ing ?",
    },
    uses: [
      "Future ke kisi khaas waqt par kaam chal raha hoga.",
      "Pehle se tay shuda kaam jo hone hi wala hai.",
    ],
    signals: ["this time tomorrow", "at 9 pm", "all day tomorrow"],
    examples: [
      {
        en: "This time tomorrow I will be flying to Dubai.",
        ur: "Kal isi waqt main Dubai ja raha hunga.",
      },
      {
        en: "At 9 pm we will be having dinner.",
        ur: "Raat 9 bajay hum khana kha rahe honge.",
      },
    ],
    mistakes: [
      {
        wrong: "Tomorrow at 9 I will having dinner.",
        right: "Tomorrow at 9 I will be having dinner.",
        why: "'be' ko mat bhoolo: will + be + ing.",
      },
    ],
  },
  {
    id: "future-perfect",
    group: "future",
    name: "Future Perfect",
    urduName: "Us waqt tak kaam ho chuka hoga",
    short: "I will have worked",
    formula: {
      positive: "Subject + will have + 3rd form",
      negative: "Subject + will not have + 3rd form",
      question: "Will + subject + have + 3rd form ?",
    },
    uses: ["Future ke kisi waqt tak kaam mukammal ho chuka hoga."],
    signals: ["by Friday", "by then", "by next year", "before"],
    examples: [
      {
        en: "I will have finished the report by Friday.",
        ur: "Main Friday tak report mukammal kar chuka hunga.",
      },
      {
        en: "By 2030 he will have saved enough money.",
        ur: "2030 tak woh kaafi paise jama kar chuka hoga.",
      },
    ],
    mistakes: [
      {
        wrong: "By Friday I will finish the report already.",
        right: "By Friday I will have finished the report.",
        why: "'by + waqt' ke saath 'will have + 3rd form' aata hai.",
      },
    ],
  },
  {
    id: "future-perfect-continuous",
    group: "future",
    name: "Future Perfect Continuous",
    urduName: "Us waqt tak kitni der se chal raha hoga",
    short: "I will have been working",
    formula: {
      positive: "Subject + will have been + verb + ing",
      negative: "Subject + will not have been + verb + ing",
      question: "Will + subject + have been + verb + ing ?",
    },
    uses: [
      "Future ke kisi waqt tak kaam kitni der se chal raha hoga.",
      "Bohat kam istemaal hota hai - sirf pehchan lo.",
    ],
    signals: ["by next month", "for", "by the time"],
    examples: [
      {
        en: "By next month I will have been working here for one year.",
        ur: "Agle mahine tak mujhe yahan kaam karte ek saal ho jayega.",
      },
    ],
    mistakes: [
      {
        wrong: "Next month I will work here for one year.",
        right: "By next month I will have been working here for one year.",
        why: "Jab arsa batana ho to 'will have been + ing' istemaal karo.",
      },
    ],
  },
];

export type QuizQuestion = {
  id: string;
  /** The sentence with a ___ blank, or a "choose the correct sentence" task. */
  prompt: string;
  options: string[];
  /** Index into options. */
  correct: number;
  why: string;
};

/**
 * Static quiz - no API call, so it costs nothing to run. Every question targets
 * one of the GOLDEN_RULES rather than testing rare grammar.
 */
export const QUIZ: QuizQuestion[] = [
  {
    id: "q1",
    prompt: "I ___ to the market yesterday.",
    options: ["will go", "go", "went", "will went"],
    correct: 2,
    why: "'yesterday' past ka lafz hai, isliye go ki doosri form 'went' aayegi. 'will' sirf future ke liye hota hai.",
  },
  {
    id: "q2",
    prompt: "Tomorrow I ___ my uncle.",
    options: ["will met", "will meet", "met", "will meeting"],
    correct: 1,
    why: "'will' ke baad hamesha verb ki pehli form: will meet.",
  },
  {
    id: "q3",
    prompt: "He ___ to school every day.",
    options: ["go", "goes", "going", "went"],
    correct: 1,
    why: "'every day' rozana ka kaam hai (Present Simple) aur 'he' ke saath verb par 's' lagta hai.",
  },
  {
    id: "q4",
    prompt: "I ___ a book right now.",
    options: ["read", "am read", "am reading", "will read"],
    correct: 2,
    why: "'right now' ka matlab abhi ho raha hai. am/is/are + verb + ing.",
  },
  {
    id: "q5",
    prompt: "She ___ not come yesterday.",
    options: ["does", "did", "will", "is"],
    correct: 1,
    why: "Past ki nafi (negative) ke liye 'did not' aata hai: She did not come.",
  },
  {
    id: "q6",
    prompt: "I have ___ my homework.",
    options: ["did", "do", "done", "doing"],
    correct: 2,
    why: "'have' ke baad hamesha teesri form: do → did → done.",
  },
  {
    id: "q7",
    prompt: "Kaunsa jumla sahih hai?",
    options: [
      "I will worked tomorrow.",
      "I will working tomorrow.",
      "I will work tomorrow.",
      "I worked tomorrow.",
    ],
    correct: 2,
    why: "'will' ke baad saada verb: will work. Yeh sab se aam galti hai.",
  },
  {
    id: "q8",
    prompt: "They ___ cricket when it started raining.",
    options: ["was playing", "were playing", "are playing", "will play"],
    correct: 1,
    why: "'they' ke saath 'were' aata hai, aur chalta hua kaam batane ke liye ing.",
  },
  {
    id: "q9",
    prompt: "We ___ in this house for five years.",
    options: ["live", "are living", "have lived", "will live"],
    correct: 2,
    why: "Kaam pehle shuru hua aur abhi tak jaari hai + 'for five years' → Present Perfect.",
  },
  {
    id: "q10",
    prompt: "Did you ___ the email?",
    options: ["sent", "send", "sending", "sends"],
    correct: 1,
    why: "'Did' pehle hi past bata raha hai, isliye verb pehli form mein: send.",
  },
  {
    id: "q11",
    prompt: "By Friday I ___ the report.",
    options: ["will finish", "will have finished", "finished", "have finished"],
    correct: 1,
    why: "'by + waqt' ke saath Future Perfect: will have + teesri form.",
  },
  {
    id: "q12",
    prompt: "I ___ two hours. Where were you?",
    options: [
      "am waiting since",
      "have been waiting for",
      "was waiting since",
      "wait for",
    ],
    correct: 1,
    why: "Arse (duration) ke liye 'for', aur ab tak jaari kaam ke liye 'have been + ing'.",
  },
  {
    id: "q13",
    prompt: "The train ___ before I reached the station.",
    options: ["left", "has left", "had left", "will leave"],
    correct: 2,
    why: "Do purane kaam mein se jo pehle hua us par 'had + teesri form' lagta hai.",
  },
  {
    id: "q14",
    prompt: "My father ___ in a bank.",
    options: ["work", "works", "working", "is work"],
    correct: 1,
    why: "'my father' = he. Present Simple mein verb par 's' lagega.",
  },
  {
    id: "q15",
    prompt: "She ___ to Dubai last year.",
    options: ["goes", "went", "will go", "going"],
    correct: 1,
    why: "'last year' past hai: go → went.",
  },
  {
    id: "q16",
    prompt: "He is ___ TV at the moment.",
    options: ["watch", "watches", "watching", "watched"],
    correct: 2,
    why: "'is' ke baad verb ke saath ing zaroori hai.",
  },
  {
    id: "q17",
    prompt: "___ you help me tomorrow?",
    options: ["Did", "Have", "Will", "Was"],
    correct: 2,
    why: "'tomorrow' future hai, isliye sawal 'Will' se shuru hoga.",
  },
  {
    id: "q18",
    prompt: "I did not ___ him yesterday.",
    options: ["saw", "see", "seen", "seeing"],
    correct: 1,
    why: "'did not' ke baad pehli form: see, saw nahin.",
  },
  {
    id: "q19",
    prompt: "This time tomorrow I ___ to Islamabad.",
    options: ["will fly", "will be flying", "am flying", "flew"],
    correct: 1,
    why: "Future ke khaas waqt par chalta hua kaam → will be + ing.",
  },
  {
    id: "q20",
    prompt: "We ___ dinner when the light went off.",
    options: ["was having", "were having", "are having", "have"],
    correct: 1,
    why: "'we' ke saath 'were', aur chalta hua kaam batane ke liye having.",
  },
];

export type IrregularVerb = {
  base: string;
  past: string;
  participle: string;
  urdu: string;
};

/**
 * The verbs that break the "+ed" rule. Learning these kills most past-tense
 * mistakes, because "I goed" / "I have went" both come from not knowing them.
 */
export const IRREGULAR_VERBS: IrregularVerb[] = [
  { base: "be", past: "was / were", participle: "been", urdu: "hona" },
  { base: "begin", past: "began", participle: "begun", urdu: "shuru karna" },
  { base: "break", past: "broke", participle: "broken", urdu: "torna" },
  { base: "bring", past: "brought", participle: "brought", urdu: "lana" },
  { base: "buy", past: "bought", participle: "bought", urdu: "khareedna" },
  { base: "come", past: "came", participle: "come", urdu: "aana" },
  { base: "do", past: "did", participle: "done", urdu: "karna" },
  { base: "drink", past: "drank", participle: "drunk", urdu: "peena" },
  { base: "drive", past: "drove", participle: "driven", urdu: "gaari chalana" },
  { base: "eat", past: "ate", participle: "eaten", urdu: "khana" },
  { base: "fall", past: "fell", participle: "fallen", urdu: "girna" },
  { base: "feel", past: "felt", participle: "felt", urdu: "mehsoos karna" },
  { base: "find", past: "found", participle: "found", urdu: "milna / dhoondna" },
  { base: "forget", past: "forgot", participle: "forgotten", urdu: "bhoolna" },
  { base: "get", past: "got", participle: "got", urdu: "hasil karna" },
  { base: "give", past: "gave", participle: "given", urdu: "dena" },
  { base: "go", past: "went", participle: "gone", urdu: "jana" },
  { base: "have", past: "had", participle: "had", urdu: "rakhna" },
  { base: "hear", past: "heard", participle: "heard", urdu: "sunna" },
  { base: "keep", past: "kept", participle: "kept", urdu: "rakhna" },
  { base: "know", past: "knew", participle: "known", urdu: "jaanna" },
  { base: "leave", past: "left", participle: "left", urdu: "chhorna" },
  { base: "lose", past: "lost", participle: "lost", urdu: "khona" },
  { base: "make", past: "made", participle: "made", urdu: "banana" },
  { base: "meet", past: "met", participle: "met", urdu: "milna" },
  { base: "pay", past: "paid", participle: "paid", urdu: "paise dena" },
  { base: "put", past: "put", participle: "put", urdu: "rakhna" },
  { base: "read", past: "read", participle: "read", urdu: "parhna" },
  { base: "run", past: "ran", participle: "run", urdu: "daurna" },
  { base: "say", past: "said", participle: "said", urdu: "kehna" },
  { base: "see", past: "saw", participle: "seen", urdu: "dekhna" },
  { base: "sell", past: "sold", participle: "sold", urdu: "bechna" },
  { base: "send", past: "sent", participle: "sent", urdu: "bhejna" },
  { base: "sit", past: "sat", participle: "sat", urdu: "baithna" },
  { base: "sleep", past: "slept", participle: "slept", urdu: "sona" },
  { base: "speak", past: "spoke", participle: "spoken", urdu: "bolna" },
  { base: "take", past: "took", participle: "taken", urdu: "lena" },
  { base: "teach", past: "taught", participle: "taught", urdu: "parhana" },
  { base: "tell", past: "told", participle: "told", urdu: "batana" },
  { base: "think", past: "thought", participle: "thought", urdu: "sochna" },
  {
    base: "understand",
    past: "understood",
    participle: "understood",
    urdu: "samajhna",
  },
  { base: "write", past: "wrote", participle: "written", urdu: "likhna" },
];
