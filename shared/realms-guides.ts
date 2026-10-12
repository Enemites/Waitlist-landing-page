import type { RealmsBlogPost } from "./realms-blogs";
import { REALMS_DEFINITION, REALMS_WORLD_MODEL_EXPLANATION } from "./realms-product";

export const REALMS_GUIDES: RealmsBlogPost[] = [
  {
    slug: "what-is-enemites-realms",
    title: "What is Enemites Realms?",
    description: "What is Enemites Realms? Explore the internal AI world model, AI imagination, learning simulations, mentor reflection, and capability evidence being developed by Enemites.",
    category: "The Realms guide",
    addedAt: "2026-10-13",
    image: "/assets/blogs/what-is-enemites-realms-1536.webp",
    imageAlt: "A dark teal square frame containing a lime square on a warm paper background",
    introduction: REALMS_DEFINITION,
    facts: [
      { label: "Product", value: "Enemites Realms" },
      { label: "Built by", value: "Enemites, a student-led research-driven collective" },
      { label: "Core engine", value: "An internal AI world model in development, designed to construct scenarios and model how they change" },
      { label: "Approach", value: "Problem-based learning through simulations and reflection" },
      { label: "Public access", value: "Product introduction and launch waitlist; the product is in development" },
    ],
    sections: [
      { heading: "What is the AI world model at the core of Realms?", paragraphs: [
        REALMS_WORLD_MODEL_EXPLANATION,
        "A world model represents a situation and the relationships within it: what is happening, which resources and constraints matter, and how a decision could affect the next state. Realms is being developed around this internal modeling engine, with learning scenarios, mentor dialogue, and a record of decisions organized around the world it simulates.",
      ] },
      { heading: "What does AI imagination mean in Enemites Realms?", paragraphs: [
        "AI imagination means constructing possible situations and exploring how they might unfold. In the Realms design, the world model is intended to create scenario variations and possible next states in response to a learner's actions, while preserving the context and constraints of the simulated world.",
        "Imagine changing one choice in a resource-allocation challenge and exploring a different consequence. The learning value comes from examining those possibilities and the assumptions behind them. An imagined outcome is a model-generated possibility, not a certain forecast of the real world.",
      ] },
      { heading: "What does the name Realms refer to?", paragraphs: [
        "On enemites.com, Realms is the name of Enemites' learning product. A realm is a simulated setting in which a learner encounters a problem, chooses actions, and examines what changes. The full name Enemites Realms identifies this particular product; the general word realms is also used in unrelated games, services, and stories.",
        "Enemites describes itself as a research-driven collective. Its About Us page explains how students developed the Realms concept through questions about learning, AI, and how people demonstrate capability. Realms is one product direction within that wider organization.",
      ] },
      { heading: "What is Enemites Realms designed to help people practice?", paragraphs: [
        "The focus is problem solving in context: recognizing constraints, weighing tradeoffs, deciding what to do, and explaining why. Information matters, but the experience is intended to go beyond receiving an explanation or recalling a fact.",
        "An illustrative challenge could ask a learner to allocate limited resources across several priorities. A choice may improve one outcome while making another harder. The learning opportunity is in making that tradeoff explicit, observing the result, and reconsidering the approach. This is an example of the design, not an announcement of a released scenario.",
      ] },
      { heading: "How do simulations, AI mentorship, and reflection connect?", paragraphs: [
        "The proposed loop begins with a scenario and mission brief. The learner makes decisions, the simulated situation responds, and an AI mentor supports reflection through follow-up questions. A learner can then review the attempt and consider what to change next time.",
        "A simulation is a model, so its consequences are not reliable predictions of every real-world outcome. AI feedback can also be incomplete or mistaken. Reviewing assumptions and questioning feedback remain part of the learning process.",
      ] },
      { heading: "What does evidence of capability mean here?", paragraphs: [
        "In the Realms concept, capability evidence connects an outcome to the path behind it: the decisions made, the constraints considered, the reasoning offered, and the revisions that followed. This is intended to make practice and progress easier to discuss than a final score alone.",
        "This product direction is not a claim of an accredited qualification, a universally valid skill assessment, or guaranteed improvement. A simulation record needs interpretation in the context of the particular challenge and the limits of the model.",
      ] },
      { heading: "Who is building Enemites Realms, and who is it for?", paragraphs: [
        "The Enemites team presents Realms as a product built by students who want more responsive learning experiences. It is being shaped for learners interested in applying ideas, practicing decisions, and reflecting on how they solve problems.",
        "The public waitlist has age-group flows and a parent or guardian invitation process for children under 13. These registration rules describe the current waitlist, not a promise that every future product experience is suitable for every age. The official privacy and terms pages explain the current registration notices.",
      ] },
      { heading: "Is Enemites Realms available now?", paragraphs: [
        "Realms is in development. The public website provides an introduction, an explanation of the learning loop, information about the team, and a launch waitlist. Joining the waitlist requests launch notifications; it does not itself open a simulation session or establish a release date.",
        "The current site does not publish a product pricing plan. Check the official Realms page for availability updates and the How It Works page for the team's intended experience. Features and access details can change as development continues.",
      ] },
    ],
    faqs: [
      { question: "What is Enemites Realms in one sentence?", answer: "Enemites Realms is a learning simulation environment in development around an internal AI world model, combining imagined scenarios, learner decisions, mentor reflection, and capability evidence." },
      { question: "What is the role of the internal AI world model?", answer: "It is being developed as the core simulation engine: representing situations and constraints, constructing possible scenarios, and modeling how a learner's decisions could change the world." },
      { question: "Is Realms the same as Enemites?", answer: "Enemites is the research-driven collective building the product. Realms is the name of its learning simulation product; Enemites Realms is the full product name." },
      { question: "Is Enemites Realms a general-purpose AI chatbot?", answer: "Realms is being developed around an internal AI world model for simulated situations, actions, and possible consequences. An AI mentor supports reflection within that learning environment." },
      { question: "Does joining the waitlist provide immediate product access?", answer: "No. The public waitlist requests launch notifications. The site does not promise immediate simulation access, a specific release date, or published pricing." },
    ],
    references: [
      { label: "Official Enemites Realms introduction and waitlist", path: "/realms" },
      { label: "How Enemites Realms is designed to work", path: "/realms/how-it-works" },
      { label: "About the Enemites team", path: "/realms/about-us" },
      { label: "Learning loop walkthrough", path: "/realms/blogs/how-enemites-realms-works" },
    ],
  },
  {
    slug: "how-enemites-realms-works",
    title: "How does Enemites Realms work?",
    description: "How Enemites Realms is designed to work: an internal AI world model constructs a scenario, models decisions and consequences, and supports a learning loop with reflection.",
    category: "Inside the learning loop",
    addedAt: "2026-10-13",
    image: "/assets/blogs/how-enemites-realms-works-1536.webp",
    imageAlt: "A dark teal circular ring with one lime segment on a warm paper background",
    introduction: "Enemites Realms is being designed around an internal AI world model and a repeatable learning loop. The model is intended to construct a simulated problem and explore how decisions change it; the learner acts, observes a consequence, reflects with an AI mentor, and reviews evidence from the attempt. This walkthrough explains the intended process while the product is in development.",
    sections: [
      { heading: "1. Understand the scenario and its constraints", paragraphs: [
        "The starting point is a mission brief: what is happening, what you are trying to achieve, and which constraints you need to consider. The internal AI world model is being developed to construct this scenario context and its possible developments. The team's product direction includes adapting the context to a learner's field and level; specific scenario catalogs and availability remain part of development.",
        "The useful question is not only 'What do I know?' but also 'What information do I need before acting?' That shifts attention from memorizing an answer to interpreting a situation.",
      ] },
      { heading: "2. Choose an action and explain the tradeoff", paragraphs: [
        "The learner chooses what to do under the scenario's conditions. A choice might prioritize speed, accuracy, resources, communication, or another constraint. Naming the tradeoff makes the reasoning easier to examine.",
        "Realms' stated direction is to make decisions central to the experience. There need not be one universally correct action: a useful challenge can expose several defensible options and the assumptions behind each one.",
      ] },
      { heading: "3. Observe what changes in the simulated world", paragraphs: [
        "The internal AI world model is intended to update the simulated situation around a learner's choices. Its imagination of possible next states provides another decision context and material for reflection. Feedback becomes part of the run, rather than only a score delivered after it.",
        "The response depends on the model used for the simulation. It should not be treated as a forecast of what must happen outside the learning environment. Understanding a model's limitations is itself a useful part of practice.",
      ] },
      { heading: "4. Reflect with the AI mentor", paragraphs: [
        "The AI mentor concept supports questions such as: which assumption influenced your choice, what did you expect, what did you overlook, and what would you do differently? The goal is to help the learner articulate thinking, rather than merely receive a quick answer.",
        "An AI mentor's output can be mistaken. Learners should check relevant information and challenge interpretations instead of treating feedback as an unquestionable assessment. The learner's own explanation remains central.",
      ] },
      { heading: "5. Review the attempt and plan the next one", paragraphs: [
        "The capability evidence direction brings together a trace of choices, their consequences, and the reflection that followed. A useful review explains what was practiced and what could change in another attempt.",
        "A learner may revise a strategy, collect more information, or communicate a priority more clearly. Improvement in a simulation is contextual; it does not automatically establish competence in every professional or real-world setting.",
      ] },
      { heading: "An illustrative example: a team with limited resources", paragraphs: [
        "Imagine a scenario in which a project team must divide a limited budget between investigating a problem and delivering a short-term fix. A learner selects a priority, explains the decision, observes a simulated response, and reviews what information would have changed that choice.",
        "This example illustrates the loop, not a live scenario announcement. For the current public experience, read the official product pages or join the launch waitlist. There is no published guarantee of a scenario count, session duration, release date, or pricing plan in this guide.",
      ] },
    ],
    faqs: [
      { question: "What are the main steps in the Enemites Realms learning loop?", answer: "The intended loop is scenario briefing, learner decisions, simulated consequences, AI-supported reflection, and review of capability evidence." },
      { question: "Does this guide describe a live product session?", answer: "It explains the product's intended learning design. The public Enemites Realms site currently provides product information and a launch waitlist while development continues." },
    ],
    references: [
      { label: "What is Enemites Realms?", path: "/realms/blogs/what-is-enemites-realms" },
      { label: "Official How It Works page", path: "/realms/how-it-works" },
      { label: "Reflection with an AI mentor", path: "/realms/blogs/reflection-with-an-ai-mentor" },
      { label: "What capability evidence means", path: "/realms/blogs/proof-of-capability" },
    ],
  },
  {
    slug: "enemites-realms-vs-ai-chatbots",
    title: "Enemites Realms or an AI chatbot?",
    description: "Compare Enemites Realms' internal AI world model and learning simulations with conversational AI: changing world states, decisions, reflection, and capability evidence.",
    category: "Learning approaches",
    addedAt: "2026-10-13",
    image: "/assets/blogs/enemites-realms-vs-ai-chatbots-1536.webp",
    imageAlt: "Rounded and square dark teal frames side by side, with a lime square inside the angular frame",
    introduction: "Enemites Realms is being developed around an internal AI world model as the core of a learning simulation environment. The model is intended to construct situations and explore how actions change them; an AI mentor supports reflection within that loop. A general-purpose AI chatbot primarily offers a conversational interface. This comparison explains the product direction without claiming that one approach is always better or that conversational tools cannot support simulations.",
    sections: [
      { heading: "The core engine models a changing world", paragraphs: [
        "The Realms architecture direction places an internal AI world model at the center of the experience. Its role is to represent the current situation, preserve scenario constraints, and construct possible next states when a learner acts. AI imagination supplies possibilities that the learner can explore and question.",
        "The mentor is a separate role within that learning loop: helping a learner examine the reasons for a decision and reconsider an approach. This describes the system being developed, without assuming a particular model architecture, training method, or released performance benchmark.",
      ] },
      { heading: "Conversation starts with a prompt; Realms starts with a situation", paragraphs: [
        "A chatbot can help explain an idea, ask questions, draft an example, or role-play a conversation. The learner often supplies the objective and context. Some conversational tools also include specialized workflows, tools, or learning experiences, so chat is not one uniform category.",
        "Realms' product direction begins with a scenario that supplies constraints, stakes, and a decision context. Its focus is what a learner does inside that situation, followed by a discussion of the reasoning behind the action.",
      ] },
      { heading: "Explaining a choice is different from observing a modeled consequence", paragraphs: [
        "Conversational feedback can explore possible consequences in words. A scenario-based experience is designed to update a modeled situation after a choice, making the next decision depend on what changed.",
        "That does not make simulated feedback automatically more accurate. Both an AI explanation and a simulation depend on assumptions and can be wrong or incomplete. The important learning question is whether the feedback supports a thoughtful review of those assumptions.",
      ] },
      { heading: "The AI mentor is one component of Enemites Realms", paragraphs: [
        "In the Realms concept, the AI mentor supports reflection within a wider cycle of problem, action, consequence, and review. The mentor is intended to ask follow-up questions and offer perspectives on a learner's reasoning.",
        "This is a design distinction, not a published benchmark against other AI services. Enemites has not established comparative performance, guaranteed learning gains, or universal assessment accuracy in these product introduction pages.",
      ] },
      { heading: "The proposed learning record includes the path, not only the response", paragraphs: [
        "A chat transcript can be useful for reviewing a discussion. Realms is exploring a record tied to a particular scenario: decisions taken, constraints considered, modeled effects, reflections, and revisions across attempts.",
        "Calling this capability evidence does not make it an accredited credential or a complete measure of a person. The record is meaningful only with its scenario context and the limitations of the learning model.",
      ] },
      { heading: "Which approach fits the learning task?", paragraphs: [
        "Conversation can be useful when someone wants an explanation, a sounding board, or an open-ended exploration. Scenario-based practice can be useful when the learning goal involves making choices under constraints and discussing the consequences. A learner may use both approaches for different parts of a problem.",
        "Realms is in development, and its public site currently offers information and a launch waitlist. Evaluate actual released functionality when it becomes available. This comparison explains the intended approach; it does not replace a hands-on evaluation of a released product.",
      ] },
    ],
    faqs: [
      { question: "Is Enemites Realms an alternative to every AI chatbot?", answer: "No universal replacement claim is made. Realms is being designed for scenario-based problem-solving practice, while conversational AI can support many tasks, including explanations, discussion, and learning workflows." },
      { question: "Can AI chatbots also support scenario-based learning?", answer: "Yes, conversational tools can support role-play and simulations. Realms' stated direction organizes a learning experience around modeled decisions, consequences, reflection, and contextual evidence." },
    ],
    references: [
      { label: "Official Enemites Realms product introduction", path: "/realms" },
      { label: "What is Enemites Realms?", path: "/realms/blogs/what-is-enemites-realms" },
      { label: "How the proposed learning loop works", path: "/realms/blogs/how-enemites-realms-works" },
      { label: "The Enemites team and product direction", path: "/realms/about-us" },
    ],
  },
];
