# Culture Compass

Act as a senior product designer and full-stack developer. Build a polished, responsive MVP web app called “CultureLens”—an AI cultural translator that helps users understand intercultural misunderstandings and respond appropriately.

CORE PURPOSE

This app should not treat culture as a fixed national rulebook. It should:

Separate literal meaning from implied meaning.

Present several plausible interpretations instead of claiming certainty.

Explain the cultural, interpersonal, and situational factors behind each interpretation.

Help the user choose a response based on their actual goal.

Generate culturally sensitive clarification questions and replies.

Avoid stereotypes and statements such as “Japanese people always…” or “Americans are…”.

Use probabilistic language such as:

“In some teacher–student contexts…”

“One possible interpretation is…”

“This may be influenced by…”

“There is not enough information to determine the speaker’s intention with certainty.”

PRIMARY USER FLOW

The user describes an intercultural interaction.

The user optionally adds contextual information.

The app identifies the likely communication gap.

It shows multiple plausible interpretations.

It recommends an appropriate conflict-resolution or clarification strategy.

It generates several possible responses and explains their trade-offs.

PAGE 1: Homescreen

Create a clean landing page with:

App name: 未定

Tagline: like a warm greeting line that LLM models usually give in your login screen

2 Primary buttons: “Analyse a situation” "Organise language for an output"

Secondary button: “Try an example”

A short three-step explanation:

Describe what happened.

Explore possible meanings.

Choose how to respond.

A small disclaimer: “[app name]identifies possibilities, not people’s definite intentions.”

Add a top bar to search for country names or region

Add a bottom bar that allows user to switch between different pages

PAGE 2: SITUATION ANALYSER

The main input should feel conversational and easy to use.

Required field:

“What happened?” with a large text box.

Placeholder example: “I asked my teacher about my grade before results were released. They said, ‘You don’t need to worry about it.’ I’m not sure whether that means my grade is good or that they did not want to answer.”

Add an optional “Add context” expandable section containing:

Exact words used

My cultural or communication background

The other person’s cultural or communication background

Country or social context where the interaction occurred

Relationship: teacher–student, friends, colleagues, manager–employee, customer–staff, family, or other

Communication format: face-to-face, text message, email, phone call, or group conversation

Tone, facial expression, or body language

What happened immediately before or after

User’s desired outcome: understand the meaning, avoid conflict, ask for clarification, express disagreement, apologise, preserve the relationship, or solve a practical problem

Preferred language for the generated response

The cultural-background fields must be optional. Do not imply that nationality alone determines meaning.

Include an “Analyse the situation” button, loading state, input validation, and a clear privacy note.

PAGE 3: ANALYSIS RESULTS

Display the result in clearly separated cards. Do not present one interpretation as automatically correct.

Section 1: What was literally communicated

Provide a short, neutral explanation of the literal meaning.

Section 2: Plausible interpretations

Show three to five interpretation cards. Each card should contain:

A short interpretation title

What the speaker might have meant

Why this interpretation is plausible

Contextual clues supporting it

A confidence label such as “more plausible,” “possible,” or “requires more context”

Do not use numerical probabilities unless there is actual evidence for them.

Section 3: What may be creating the gap

Classify relevant factors using tags such as:

Direct versus indirect communication

Hierarchy or power distance

Face-saving

Individual versus group orientation

Formality

Conflict avoidance

Language or idiom

Gesture or body language

Institutional rules

Personality or relationship history

Explicitly distinguish cultural explanations from individual and situational explanations.

Section 4: Facts versus assumptions

Create two columns:

“What you observed”

“What you may be inferring”

This section should help users recognise emotional reactions and unsupported assumptions before responding.

Section 5: What remains uncertain

Explain what cannot be known from the available context. Suggest one or two pieces of additional information that would improve the analysis.

Section 6: Recommended strategy

Choose one primary strategy:

Active listening and perspective-taking

Neutral clarification

Shared-goal framing

Cooperation

Compromise

Relationship-building

Educational explanation

Pause and emotional self-awareness

Explain why the strategy fits this specific situation.

Section 7: Ways you could respond

Generate three response cards:

Gentle and relationship-preserving

Clear and direct

Balanced

For each response, show:

The exact wording

The likely effect

A possible trade-off

A copy button

Also allow the user to adjust the tone using controls such as warmer, more formal, more concise, more direct, or more deferential.

Section 8: Best clarification question

Generate one neutral question that checks the speaker’s intention without sounding accusatory.

Add buttons for:

Edit context and analyse again

Copy full analysis

Save scenario

Start a new scenario

EXAMPLE RESULT

For the teacher-and-grade example, plausible interpretations may include:

The grade is probably satisfactory, and the teacher is reassuring the student.

The teacher cannot disclose the grade yet because of school rules.

The teacher is offering reassurance without confirming a particular result.

The teacher is politely ending the conversation.

A possible clarification response is:

“That’s reassuring—thank you. Just to clarify, do you mean that I’m performing satisfactorily, even though the official grade cannot be shared yet?”

The result must also state that tone, school policy, relationship, and previous interactions could change the interpretation.

SAVED SCENARIOS

Create a simple saved-scenarios page. For the MVP, store saved scenarios locally in the browser. Each saved item should show:

A short title

Date

Relationship or setting

Main communication-gap category

Recommended strategy

Users should be able to reopen or delete a saved scenario. Do not require account registration in the first version.

make it like a flashcard game quiz so that the user can revisit at anytime

ABOUT/METHODOLOGY PAGE

Explain that the app is informed by intercultural conflict-resolution principles including:

Active listening

Perspective-taking

Cooperation

Shared-goal framing

Compromise

Educational explanation

Scenario-based practice

Emotional and cultural self-awareness

Explain that these strategies do not work identically in every situation and that the app provides possibilities rather than definitive judgments.

Include a reference to this source:

https://www.nature.com/articles/s41599-025-04391-0

SAFETY AND RESPONSIBLE DESIGN

The app must:

Never make absolute claims about a nationality, ethnicity, gender, religion, or social group.

Avoid ranking cultures as better or worse.

Avoid diagnosing someone’s personality or intentions.

Clearly communicate uncertainty.

Consider institutional rules, age, power relationships, personality, and situation—not only nationality.

Avoid encouraging confrontation when the user may face a major power imbalance.

Recommend professional or trusted-person support when a scenario involves threats, harassment, discrimination, violence, or personal safety.

Never invent academic sources or claim that the analysis has scientifically determined someone’s intention.

VISUAL DESIGN

Create a modern, calm, warm, friednly, succint, academically credible interface.

Use:

Warm off-white background

Use bright yet not invasive clolours

Teal accents

Soft card shadows

Rounded corners

Clear typography

Subtle, restrained animations

Accessible colour contrast

Responsive mobile and desktop layouts

Add micro animations to make the app fluid

The tone should feel thoughtful and reassuring rather than corporate or playful. Do not overuse gradients, emojis, flags, or decorative illustrations.

TECHNICAL REQUIREMENTS

Use React, TypeScript, Tailwind CSS, and reusable components.

Create a clear component structure.

Make all navigation and buttons functional.

Include polished loading, empty, validation, and error states.

Store saved scenarios in localStorage for the MVP.

First create a realistic mocked AI response so the complete user flow can be tested without an API key.

Structure the analysis data so it can later be replaced with a real AI API response.

Add comments identifying where the AI backend will be connected.

Never place an AI API key in frontend code.

When an AI backend is added, use a secure server-side function and request structured output.

Ensure the app does not break when optional context is missing.

Build the complete MVP with realistic sample content. Prioritise the central analyser and results experience over unnecessary secondary features.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/01bc1fbb-0968-484f-9704-762eb20af319).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
