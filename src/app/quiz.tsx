import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  ActivityIndicator,
  Easing,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

type CategoryId =
  | '9'
  | '10'
  | '11'
  | '12'
  | '15'
  | '16'
  | '17'
  | '18'
  | '19'
  | '20'
  | '21'
  | '22'
  | '23'
  | '25'
  | '27';
type Difficulty = 'easy' | 'medium' | 'hard';

const difficultyLevelTitles: Record<Difficulty, string> = {
  easy: 'EASY',
  medium: 'MEDIUM',
  hard: 'HARD',
};

type Question = {
  category: string;
  question: string;
  correctAnswer: string;
  answers: string[];
};

type ApiQuestion = {
  category: string;
  question: string;
  correct_answer: string;
  incorrect_answers: string[];
};

const namedEntities: Record<string, string> = {
  '&amp;': '&',
  '&apos;': "'",
  '&eacute;': 'é',
  '&Eacute;': 'É',
  '&egrave;': 'è',
  '&Egrave;': 'È',
  '&aacute;': 'á',
  '&Aacute;': 'Á',
  '&agrave;': 'à',
  '&acirc;': 'â',
  '&aring;': 'å',
  '&ccedil;': 'ç',
  '&euml;': 'ë',
  '&iacute;': 'í',
  '&icirc;': 'î',
  '&ocirc;': 'ô',
  '&oacute;': 'ó',
  '&ouml;': 'ö',
  '&Ouml;': 'Ö',
  '&uuml;': 'ü',
  '&Uuml;': 'Ü',
  '&ntilde;': 'ñ',
  '&Ntilde;': 'Ñ',
  '&rsquo;': '’',
  '&lsquo;': '‘',
  '&rdquo;': '”',
  '&ldquo;': '“',
  '&mdash;': '—',
  '&ndash;': '–',
  '&hellip;': '…',
  '&trade;': '™',
  '&copy;': '©',
  '&reg;': '®',
  '&quot;': '"',
  '&nbsp;': ' ',
  '&lt;': '<',
  '&gt;': '>',
};

function decodeHtml(value: string): string {
  // Open Trivia DB encodes some question text as HTML entities.
  return value
    .replace(/&#(?:x([0-9a-f]+)|(\d+));/gi, (entity, hex: string, decimal: string) => {
      const codePoint = Number.parseInt(hex ?? decimal, hex ? 16 : 10);
      if (!Number.isInteger(codePoint) || codePoint < 0 || codePoint > 0x10ffff) {
        return entity;
      }
      return String.fromCodePoint(codePoint);
    })
    .replace(
      /&(?:amp|apos|eacute|Eacute|egrave|Egrave|aacute|Aacute|agrave|acirc|aring|ccedil|euml|iacute|icirc|ocirc|oacute|ouml|Ouml|uuml|Uuml|ntilde|Ntilde|rsquo|lsquo|rdquo|ldquo|mdash|ndash|hellip|trade|copy|reg|quot|nbsp|lt|gt);/g,
      (entity) => namedEntities[entity] ?? entity,
    );
}

function isCategoryId(value: string | undefined): value is CategoryId {
  return (
    value === '9' ||
    value === '10' ||
    value === '11' ||
    value === '12' ||
    value === '15' ||
    value === '16' ||
    value === '17' ||
    value === '18' ||
    value === '19' ||
    value === '20' ||
    value === '21' ||
    value === '22' ||
    value === '23' ||
    value === '25' ||
    value === '27'
  );
}

function isDifficulty(value: string | undefined): value is Difficulty {
  return value === 'easy' || value === 'medium' || value === 'hard';
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function getApiQuestions(payload: unknown, expectedCount: number): Question[] {
  if (!isRecord(payload) || typeof payload.response_code !== 'number') {
    throw new Error('The trivia service returned an unexpected response. Please try again.');
  }

  if (payload.response_code !== 0) {
    const messages: Record<number, string> = {
      1: 'No questions were found for this subject and difficulty. Try another combination.',
      2: 'The trivia service rejected the request. Please try again.',
      3: 'The trivia session has expired. Please start a new quiz.',
      4: 'The trivia service has no more questions available. Please try again later.',
      5: 'The trivia service is receiving too many requests. Please wait a moment and retry.',
    };
    throw new Error(messages[payload.response_code] ?? 'The trivia service could not load questions.');
  }

  if (!Array.isArray(payload.results) || payload.results.length !== expectedCount) {
    throw new Error(`The trivia service did not return ${expectedCount} questions. Please try again.`);
  }

  return payload.results.map((item: unknown) => {
    if (
      !isRecord(item) ||
      typeof item.category !== 'string' ||
      typeof item.question !== 'string' ||
      typeof item.correct_answer !== 'string' ||
      !Array.isArray(item.incorrect_answers) ||
      item.incorrect_answers.length !== 3 ||
      !item.incorrect_answers.every((answer: unknown) => typeof answer === 'string')
    ) {
      throw new Error('A question from the trivia service was incomplete. Please try again.');
    }

    const apiQuestion: ApiQuestion = {
      category: item.category,
      question: item.question,
      correct_answer: item.correct_answer,
      incorrect_answers: item.incorrect_answers,
    };
    const answers = [
      ...apiQuestion.incorrect_answers.map(decodeHtml),
      decodeHtml(apiQuestion.correct_answer),
    ];
    // Keep the correct answer from appearing in a predictable position.
    for (let index = answers.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(Math.random() * (index + 1));
      [answers[index], answers[swapIndex]] = [answers[swapIndex], answers[index]];
    }

    return {
      category: decodeHtml(apiQuestion.category),
      question: decodeHtml(apiQuestion.question),
      correctAnswer: decodeHtml(apiQuestion.correct_answer),
      answers,
    };
  });
}

export default function QuizScreen() {
  const { categoryId, difficulty, amount } = useLocalSearchParams<{
    categoryId?: string | string[];
    difficulty?: string | string[];
    amount?: string | string[];
  }>();
  const categoryIdParam = Array.isArray(categoryId) ? categoryId[0] : categoryId;
  const difficultyParam = Array.isArray(difficulty) ? difficulty[0] : difficulty;
  const amountParam = Array.isArray(amount) ? amount[0] : amount;
  const questionCount = amountParam === undefined ? 5 : Number(amountParam);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [textScale, setTextScale] = useState(0);
  const progressAnimation = useRef(new Animated.Value(0)).current;
  const questionTransition = useRef(new Animated.Value(1)).current;
  const scoreAnimation = useRef(new Animated.Value(0.85)).current;

  useEffect(() => {
    let isActive = true;

    async function loadQuestions() {
      setIsLoading(true);
      setError(null);
      setQuestions([]);
      setCurrentIndex(0);
      setScore(0);
      setSelectedAnswer(null);

      if (
        !isCategoryId(categoryIdParam) ||
        !isDifficulty(difficultyParam) ||
        !Number.isInteger(questionCount) ||
        questionCount < 1 ||
        questionCount > 50
      ) {
        setError('The selected subject, difficulty, or question count is invalid. Return home and try again.');
        setIsLoading(false);
        return;
      }

      try {
        const url = `https://opentdb.com/api.php?amount=${questionCount}&category=${categoryIdParam}&difficulty=${difficultyParam}&type=multiple`;
        const response = await fetch(url);

        if (!response.ok) {
          throw new Error(`The trivia service is unavailable (HTTP ${response.status}). Please try again.`);
        }

        const payload: unknown = await response.json();
        const loadedQuestions = getApiQuestions(payload, questionCount);

        if (isActive) {
          setQuestions(loadedQuestions);
        }
      } catch (caughtError) {
        if (isActive) {
          setError(
            caughtError instanceof Error
              ? caughtError.message
              : 'Unable to load questions. Check your connection and try again.',
          );
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    void loadQuestions();

    return () => {
      isActive = false;
    };
  }, [categoryIdParam, difficultyParam, questionCount, retryCount]);

  const currentQuestion = questions[currentIndex];
  const isFinished = questions.length > 0 && currentIndex >= questions.length;

  useEffect(() => {
    const animation = Animated.timing(progressAnimation, {
      toValue: questions.length === 0 ? 0 : (currentIndex + 1) / questions.length,
      duration: 350,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    });
    animation.start();

    return () => animation.stop();
  }, [currentIndex, progressAnimation, questions.length]);

  useEffect(() => {
    questionTransition.setValue(0);
    const animation = Animated.timing(questionTransition, {
      toValue: 1,
      duration: 260,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });
    animation.start();

    return () => animation.stop();
  }, [currentIndex, questionTransition, questions.length]);

  useEffect(() => {
    if (!isFinished) {
      return;
    }

    const animation = Animated.spring(scoreAnimation, {
      toValue: 1,
      damping: 12,
      stiffness: 150,
      useNativeDriver: true,
    });
    animation.start();

    return () => animation.stop();
  }, [isFinished, scoreAnimation]);

  function chooseAnswer(answer: string) {
    if (selectedAnswer !== null) {
      return;
    }

    setSelectedAnswer(answer);
    if (answer === currentQuestion?.correctAnswer) {
      setScore((currentScore) => currentScore + 1);
    }
  }

  function continueQuiz() {
    if (selectedAnswer === null) {
      return;
    }

    setSelectedAnswer(null);
    setCurrentIndex((index) => index + 1);
  }

  function renderError() {
    return (
      <View style={styles.messageContent}>
        <View style={styles.messageMark}>
          <Text style={styles.messageMarkText}>!</Text>
        </View>
        <Text style={styles.messageTitle}>We hit a snag</Text>
        <Text style={styles.messageBody}>{error}</Text>
        <Pressable
          accessibilityRole="button"
          onPress={() => setRetryCount((count) => count + 1)}
          style={({ pressed }) => [styles.primaryButton, pressed && styles.buttonPressed]}>
          <Text style={styles.primaryButtonText}>Try again</Text>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={() => router.push('/')} style={styles.textButton}>
          <Text style={styles.textButtonLabel}>Back to home</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.topBar}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Go back"
            onPress={() => router.push('/')}
            style={styles.backButton}>
            <Text style={styles.backButtonText}>‹</Text>
          </Pressable>
          <Text style={styles.topBarLabel}>
            YOUR QUIZ
            {isDifficulty(difficultyParam)
              ? ` · ${difficultyLevelTitles[difficultyParam]}`
              : ''}
            {` · ${questionCount} QUESTIONS`}
          </Text>
          <View style={styles.topBarSpacer} />
        </View>

        {isLoading ? (
          <View style={styles.messageContent}>
            <ActivityIndicator size="large" color="#244A3D" />
            <Text style={styles.loadingTitle}>Finding your questions…</Text>
            <Text style={styles.messageBody}>A fresh set of {questionCount} is on its way.</Text>
          </View>
        ) : error ? (
          renderError()
        ) : isFinished ? (
          <View style={styles.messageContent}>
            <Animated.View
              style={[
                styles.scoreBadge,
                { transform: [{ scale: scoreAnimation }] },
              ]}>
              <Text style={styles.scoreValue}>{score}</Text>
              <Text style={styles.scoreTotal}>/ {questions.length}</Text>
            </Animated.View>
            <Text style={styles.messageTitle}>Nicely done.</Text>
            <Text style={styles.messageBody}>
              {score === questions.length
                ? 'A perfect round. Your curiosity is paying off.'
                : `${score} ${score === 1 ? 'answer' : 'answers'} right. Every round is a chance to learn something new.`}
            </Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push('/')}
              style={({ pressed }) => [styles.primaryButton, pressed && styles.buttonPressed]}>
              <Text style={styles.primaryButtonText}>Play again</Text>
            </Pressable>
          </View>
        ) : currentQuestion ? (
          <Animated.View
            style={[
              styles.quiz,
              {
                opacity: questionTransition,
                transform: [
                  {
                    translateY: questionTransition.interpolate({
                      inputRange: [0, 1],
                      outputRange: [10, 0],
                    }),
                  },
                ],
              },
            ]}>
            <View style={styles.progressRow}>
              <Text style={styles.progressLabel}>
                QUESTION {currentIndex + 1}{' '}
                <Text style={styles.progressDivider}>/ {questions.length}</Text>
              </Text>
              <Text style={styles.scoreLabel}>Score {score}</Text>
            </View>
            <View style={styles.progressTrack}>
              <Animated.View
                style={[
                  styles.progressFill,
                  {
                    width: progressAnimation.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0%', '100%'],
                    }),
                  },
                ]}
              />
            </View>

            <View style={styles.readingControls}>
              <Text style={styles.readingLabel}>TEXT SIZE</Text>
              <View style={styles.readingOptions}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Decrease text size"
                  accessibilityState={{ disabled: textScale === -1 }}
                  disabled={textScale === -1}
                  onPress={() => setTextScale((size) => Math.max(-1, size - 1))}
                  style={({ pressed }) => [
                    styles.readingButton,
                    textScale === -1 && styles.readingButtonDisabled,
                    pressed && styles.buttonPressed,
                  ]}>
                  <Text style={styles.readingButtonText}>A−</Text>
                </Pressable>
                <Text style={styles.readingValue}>
                  {textScale === 0 ? 'Default' : textScale < 0 ? 'Small' : 'Large'}
                </Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Increase text size"
                  accessibilityState={{ disabled: textScale === 1 }}
                  disabled={textScale === 1}
                  onPress={() => setTextScale((size) => Math.min(1, size + 1))}
                  style={({ pressed }) => [
                    styles.readingButton,
                    textScale === 1 && styles.readingButtonDisabled,
                    pressed && styles.buttonPressed,
                  ]}>
                  <Text style={[styles.readingButtonText, styles.readingButtonLarge]}>A+</Text>
                </Pressable>
              </View>
            </View>

            <Text style={styles.category}>{currentQuestion.category}</Text>
            <Text
              style={[
                styles.question,
                {
                  fontSize: 25 + textScale * 3,
                  lineHeight: 33 + textScale * 4,
                },
              ]}>
              {currentQuestion.question}
            </Text>

            <View style={styles.answers}>
              {currentQuestion.answers.map((answer, index) => {
                const isSelected = selectedAnswer === answer;
                const isCorrect = answer === currentQuestion.correctAnswer;
                const showCorrect = selectedAnswer !== null && isCorrect;
                const showIncorrect = isSelected && !isCorrect;

                return (
                  <Pressable
                    key={`${currentIndex}-${index}`}
                    accessibilityRole="button"
                    accessibilityState={{ selected: isSelected, disabled: selectedAnswer !== null }}
                    disabled={selectedAnswer !== null}
                    onPress={() => chooseAnswer(answer)}
                    style={[
                      styles.answer,
                      showCorrect && styles.answerCorrect,
                      showIncorrect && styles.answerIncorrect,
                    ]}>
                    <View
                      style={[
                        styles.answerLetter,
                        showCorrect && styles.answerLetterCorrect,
                        showIncorrect && styles.answerLetterIncorrect,
                      ]}>
                      <Text
                        style={[
                          styles.answerLetterText,
                          (showCorrect || showIncorrect) && styles.answerLetterTextActive,
                        ]}>
                        {String.fromCharCode(65 + index)}
                      </Text>
                    </View>
                    <Text
                      style={[
                        styles.answerText,
                        {
                          fontSize: 14 + textScale * 2,
                          lineHeight: 20 + textScale * 3,
                        },
                      ]}>
                      {answer}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {selectedAnswer !== null ? (
              <>
                <Text
                  accessibilityLiveRegion="polite"
                  style={[
                    styles.answerFeedback,
                    selectedAnswer === currentQuestion.correctAnswer
                      ? styles.answerFeedbackCorrect
                      : styles.answerFeedbackIncorrect,
                  ]}>
                  {selectedAnswer === currentQuestion.correctAnswer
                    ? 'Correct — nicely done!'
                    : `Not quite. The answer is ${currentQuestion.correctAnswer}.`}
                </Text>
                <Pressable
                  accessibilityRole="button"
                  onPress={continueQuiz}
                  style={({ pressed }) => [styles.primaryButton, pressed && styles.buttonPressed]}>
                  <Text style={styles.primaryButtonText}>
                    {currentIndex === questions.length - 1 ? 'See your score' : 'Next question'}
                  </Text>
                  <Text style={styles.primaryButtonArrow}>→</Text>
                </Pressable>
              </>
            ) : (
              <Text style={styles.answerHint}>Choose one answer to continue.</Text>
            )}
          </Animated.View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F9F9F6',
  },
  content: {
    flexGrow: 1,
    width: '100%',
    maxWidth: 900,
    alignSelf: 'center',
    paddingHorizontal: 32,
    paddingTop: 24,
    paddingBottom: 36,
  },
  topBar: {
    height: 42,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E3E9E2',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
  },
  backButtonText: {
    color: '#244A3D',
    fontSize: 30,
    lineHeight: 34,
    marginTop: -3,
  },
  topBarLabel: {
    color: '#718078',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  topBarSpacer: {
    width: 38,
  },
  quiz: {
    paddingTop: 36,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressLabel: {
    color: '#244A3D',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.1,
  },
  progressDivider: {
    color: '#A3ADA6',
    fontWeight: '500',
  },
  scoreLabel: {
    color: '#718078',
    fontSize: 12,
    fontWeight: '600',
  },
  progressTrack: {
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E3E9E2',
    marginTop: 12,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#244A3D',
    borderRadius: 2,
  },
  readingControls: {
    marginTop: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  readingLabel: {
    color: '#89948E',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
  },
  readingOptions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  readingButton: {
    width: 36,
    height: 32,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: '#E3E9E2',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  readingButtonDisabled: {
    opacity: 0.45,
  },
  readingButtonText: {
    color: '#244A3D',
    fontSize: 14,
    fontWeight: '700',
  },
  readingButtonLarge: {
    fontSize: 17,
  },
  readingValue: {
    minWidth: 48,
    color: '#718078',
    fontSize: 11,
    textAlign: 'center',
  },
  category: {
    color: '#244A3D',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.4,
    marginTop: 38,
    marginBottom: 12,
  },
  question: {
    color: '#244A3D',
    fontSize: 25,
    fontWeight: '700',
    letterSpacing: -0.5,
    lineHeight: 33,
    marginBottom: 25,
  },
  answers: {
    gap: 10,
  },
  answer: {
    minHeight: 58,
    borderWidth: 1,
    borderColor: '#E3E9E2',
    borderRadius: 13,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  answerCorrect: {
    borderColor: '#7CA64B',
    backgroundColor: '#F1F7E8',
  },
  answerIncorrect: {
    borderColor: '#D98978',
    backgroundColor: '#FCF1EE',
  },
  answerLetter: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0F3EE',
    marginRight: 12,
  },
  answerLetterCorrect: {
    backgroundColor: '#7CA64B',
  },
  answerLetterIncorrect: {
    backgroundColor: '#D98978',
  },
  answerLetterText: {
    color: '#58766D',
    fontSize: 12,
    fontWeight: '700',
  },
  answerLetterTextActive: {
    color: '#FFFFFF',
  },
  answerText: {
    flex: 1,
    color: '#34433D',
    fontSize: 14,
    lineHeight: 20,
  },
  answerHint: {
    color: '#89948E',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 22,
  },
  answerFeedback: {
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 19,
    marginTop: 18,
    textAlign: 'center',
  },
  answerFeedbackCorrect: {
    color: '#587B36',
  },
  answerFeedbackIncorrect: {
    color: '#A64E3E',
  },
  primaryButton: {
    minHeight: 54,
    borderRadius: 14,
    paddingHorizontal: 18,
    backgroundColor: '#244A3D',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 24,
  },
  buttonPressed: {
    opacity: 0.84,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  primaryButtonArrow: {
    color: '#FFFFFF',
    fontSize: 20,
  },
  messageContent: {
    flex: 1,
    minHeight: 470,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  loadingTitle: {
    color: '#244A3D',
    fontSize: 18,
    fontWeight: '700',
    marginTop: 20,
  },
  messageMark: {
    width: 54,
    height: 54,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F4E9DC',
    marginBottom: 20,
  },
  messageMarkText: {
    color: '#A86D35',
    fontSize: 25,
    fontWeight: '700',
  },
  messageTitle: {
    color: '#244A3D',
    fontSize: 27,
    fontWeight: '700',
    letterSpacing: -0.5,
    textAlign: 'center',
    marginTop: 18,
  },
  messageBody: {
    color: '#718078',
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
    marginTop: 9,
    maxWidth: 300,
  },
  textButton: {
    paddingVertical: 14,
    paddingHorizontal: 18,
  },
  textButtonLabel: {
    color: '#58766D',
    fontSize: 13,
    fontWeight: '600',
  },
  scoreBadge: {
    width: 126,
    height: 126,
    borderRadius: 63,
    backgroundColor: '#EAF1D9',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  scoreValue: {
    color: '#244A3D',
    fontSize: 48,
    fontWeight: '700',
    letterSpacing: -2,
  },
  scoreTotal: {
    color: '#718078',
    fontSize: 18,
    marginTop: 17,
    marginLeft: 3,
  },
});
