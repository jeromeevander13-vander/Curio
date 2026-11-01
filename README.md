# CURIO

CURIO is a trivia quiz app built to make exploring new topics simple and enjoyable. Choose a subject, pick a difficulty, and play a short multiple-choice quiz at your own pace.

## Features

- **15 trivia subjects**, including General Knowledge, Science, Computers / Programming, Logical Reasoning & Math, Geography, English & Literature, History, Mythology, Sports, Animals, Art, Video Games, Film, Music, and Board Games.
- **Three difficulty settings:** Easy, Medium, and Hard. These describe general trivia difficulty and do not correspond to school grade levels or curriculum.
- **Flexible quiz length:** Choose between 1 and 50 questions.
- **Multiple-choice questions:** Select from four answers, with feedback after each choice.
- **Progress and scoring:** Follow your progress during the quiz and see your final score when you finish.
- **Reading controls:** Adjust question text size while playing.
- **Retry support:** Try loading questions again if the trivia service or network is unavailable.
- **Responsive interface:** Built with React Native and Expo for mobile and web.

Questions are loaded from the [Open Trivia Database](https://opentdb.com/), so an internet connection is required to play. Question availability depends on the selected subject and difficulty.

## Getting started

### Requirements

- Node.js and npm
- An internet connection
- Expo Go, an Android emulator, an iOS simulator, or a web browser

### Install and run

From the project directory:

```bash
npm install
npm start
```

Then use the Expo terminal shortcuts to open the app on Android, iOS, or web. You can also start a specific platform with:

```bash
npm run android
npm run ios
npm run web
```

## Development

Run the project linter with:

```bash
npm run lint
```

To check TypeScript types:

```bash
npx tsc --noEmit
```

## Project structure

```text
src/
  app/
    _layout.tsx   # App navigation layout
    index.tsx     # Home screen and quiz setup
    quiz.tsx      # Quiz questions, answers, and results
assets/
  images/         # App icons and images
components/       # Reusable interface components
```

The app uses Expo Router for navigation. The home screen collects the quiz settings and passes them to the quiz screen, which requests and presents the questions.
