export type RealmsBlogPost = {
  slug: string;
  title: string;
  description: string;
  category: string;
  addedAt: string;
  image: string;
  imageAlt: string;
  introduction: string;
  sections: { heading: string; paragraphs: string[] }[];
};

// Keep new entries first when multiple articles share the same publication date.
const posts: RealmsBlogPost[] = [
  {
    slug: "learning-through-simulation",
    title: "Learning begins with a decision.",
    description: "Explore why Enemites Realms starts with a problem to solve, and how simulations connect decisions with consequences.",
    category: "Learning by doing",
    addedAt: "2026-10-12",
    image: "/assets/blogs/learning-through-simulation-1536.webp",
    imageAlt: "Floating graphite worlds connected by branching lime paths around a decision point",
    introduction: "Knowing an answer and choosing what to do are different experiences. Enemites Realms is being built around the second: entering a situation, making a decision, and discovering what that decision changes.",
    sections: [
      {
        heading: "Start with a situation, not a blank page.",
        paragraphs: [
          "A useful problem has context. There are people to consider, resources to manage, and tradeoffs that cannot all be resolved at once. A simulation gives those constraints a place to exist, so learning can begin with a concrete question: what would you do next?",
          "Imagine a team responding to a sudden shortage. Spending more may protect one priority while putting another at risk. The point is to examine the reasoning behind a choice, rather than pretend there is one perfect answer for every situation.",
        ],
      },
      {
        heading: "Make consequences part of the lesson.",
        paragraphs: [
          "The Realms learning loop connects a learner's action to what happens next. A decision changes the situation, and that new situation creates another opportunity to think. Instead of treating feedback as something that only arrives at the end, the design places it inside the experience.",
          "A simulation is still a model. It simplifies reality, and its outcomes should be discussed as part of that model rather than treated as predictions about the real world.",
        ],
      },
      {
        heading: "Leave room to try again.",
        paragraphs: [
          "A second attempt can be as valuable as the first. After reviewing a result, a learner can reconsider an assumption, test another approach, and explain why their thinking changed. That cycle of action and revision is central to the Realms concept.",
          "Realms is currently in development. Our goal is to make problem-solving practice easier to enter while preserving the reflection that gives the practice meaning.",
        ],
      },
    ],
  },
  {
    slug: "reflection-with-an-ai-mentor",
    title: "The next question matters more than a quick answer.",
    description: "How the Realms AI mentor concept uses reflection to help learners examine assumptions, explain choices, and plan another attempt.",
    category: "Reflection & mentorship",
    addedAt: "2026-10-12",
    image: "/assets/blogs/reflection-with-an-ai-mentor-1536.webp",
    imageAlt: "Two reflective dark sculptures exchange lime light threads, representing thoughtful dialogue",
    introduction: "A simulation can show what happened. Reflection helps a learner ask why. The AI mentor concept in Enemites Realms is designed around that space between an outcome and the next decision.",
    sections: [
      {
        heading: "Pause before moving on.",
        paragraphs: [
          "When a choice succeeds, it is tempting to assume the reasoning was sound. When it fails, it is tempting to dismiss the attempt. Both reactions can miss useful information. A short pause creates room to ask what you expected, what you noticed, and what you overlooked.",
          "Realms is being designed to include reflection within its learning loop, so reviewing a decision feels like part of the experience rather than an unrelated task after it.",
        ],
      },
      {
        heading: "Use questions to make thinking visible.",
        paragraphs: [
          "What information did you rely on? Which constraint mattered most? What would have made you choose differently? Questions like these help turn an instinctive response into reasoning that can be examined and discussed.",
          "The intended role of an AI mentor is to support that examination. It can offer prompts and alternative perspectives, but its output can be incomplete or mistaken. Learners should question its suggestions and retain responsibility for their own interpretation.",
        ],
      },
      {
        heading: "Turn reflection into another experiment.",
        paragraphs: [
          "A reflection becomes useful when it changes the next attempt. A learner might decide to gather more information, compare two options more carefully, or communicate a tradeoff earlier. That gives the next run a purpose beyond simply trying to get a higher score.",
          "This is the mentorship direction we are exploring for Realms: a partner for thinking through a problem, with room for uncertainty, revision, and a learner's own voice.",
        ],
      },
    ],
  },
  {
    slug: "proof-of-capability",
    title: "Show the thinking behind the result.",
    description: "Why Enemites Realms is exploring capability evidence that connects a result with the decisions, reasoning, and revisions behind it.",
    category: "Evidence of capability",
    addedAt: "2026-10-12",
    image: "/assets/blogs/proof-of-capability-1536.webp",
    imageAlt: "Smoked-glass evidence layers connected by a lime thread around a graphite monolith",
    introduction: "A result tells one part of a learning story. The path to that result tells another. Enemites Realms is exploring how to make that path visible through evidence of decisions, reflection, and improvement.",
    sections: [
      {
        heading: "A score needs context.",
        paragraphs: [
          "Two learners can reach a similar outcome using different approaches. One may test assumptions carefully; another may make a lucky guess. Looking only at the final result makes those differences difficult to see.",
          "The Realms concept considers the sequence of an attempt: the problem presented, the choices made, the consequences observed, and the explanation a learner gives afterward. Together, those details offer a richer account than a single number.",
        ],
      },
      {
        heading: "Connect evidence to a specific situation.",
        paragraphs: [
          "Evidence is more useful when someone can understand where it came from. What was the challenge? What information was available? Which tradeoffs did the learner recognize? A clear record should make those questions easier to answer.",
          "Performance within a simulation does not automatically establish capability in every real-world setting. Any interpretation needs to respect the limits of the scenario, the model, and the evidence collected.",
        ],
      },
      {
        heading: "Make progress explainable.",
        paragraphs: [
          "An improved attempt can reveal more than an improved outcome. It can show that a learner recognized a missing assumption, changed a strategy, or explained a decision more clearly. These are the changes we want the learning experience to help surface.",
          "Realms remains in development, and capability evidence is part of its product direction. The ambition is to help learners describe what they practiced and how their thinking evolved, without reducing the whole experience to a credential or score.",
        ],
      },
    ],
  },
];

export const REALMS_BLOGS = [...posts].sort((a, b) => b.addedAt.localeCompare(a.addedAt));
export const LATEST_REALMS_BLOGS = REALMS_BLOGS.slice(0, 3);
export const realmsBlogPath = (slug: string) => `/realms/blogs/${slug}`;
export const findRealmsBlog = (slug: string) => REALMS_BLOGS.find(post => post.slug === slug);

export function formatBlogDate(date: string) {
  return new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" }).format(new Date(date));
}
