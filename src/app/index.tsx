
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Platform,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';

type Subject = {
  categoryId: string;
  title: string;
  subtitle: string;
};

type Difficulty = 'easy' | 'medium' | 'hard';

const difficulties: { value: Difficulty; title: string; subtitle: string }[] = [
  { value: 'easy', title: 'Easy', subtitle: 'Easier general-trivia questions' },
  { value: 'medium', title: 'Medium', subtitle: 'Moderate general-trivia questions' },
  { value: 'hard', title: 'Hard', subtitle: 'More challenging general-trivia questions' },
];

const subjects: Subject[] = [
  { categoryId: '9', title: 'General Knowledge', subtitle: 'A little bit of everything' },
  { categoryId: '17', title: 'Science', subtitle: 'Discover how things work' },
  { categoryId: '18', title: 'Computers / Programming', subtitle: 'Explore the digital world' },
  { categoryId: '19', title: 'Logical Reasoning & Math', subtitle: 'Numbers, patterns, and problem-solving' },
  { categoryId: '22', title: 'Geography', subtitle: 'Explore the world' },
  { categoryId: '10', title: 'English & Literature', subtitle: 'Writers, stories, and great books' },
  { categoryId: '23', title: 'History', subtitle: 'People and events that shaped our world' },
  { categoryId: '20', title: 'Mythology', subtitle: 'Legends and ancient stories' },
  { categoryId: '21', title: 'Sports', subtitle: 'Games, teams, and athletic records' },
  { categoryId: '27', title: 'Animals', subtitle: 'Wildlife from around the world' },
  { categoryId: '25', title: 'Art', subtitle: 'Artists, movements, and masterpieces' },
  { categoryId: '15', title: 'Video Games', subtitle: 'Worlds, characters, and gaming history' },
  { categoryId: '11', title: 'Film', subtitle: 'Movies from classics to modern favorites' },
  { categoryId: '12', title: 'Music', subtitle: 'Artists, songs, and musical history' },
  { categoryId: '16', title: 'Board Games', subtitle: 'Classic games and tabletop trivia' },
];

export default function HomeScreen() {
  const entrance = useRef(new Animated.Value(0)).current;
  const scrollY = useRef(new Animated.Value(0)).current;
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const [selectedCategoryId, setSelectedCategoryId] = useState('9');
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>('easy');
  const [questionCount, setQuestionCount] = useState('5');
  const [questionCountError, setQuestionCountError] = useState<string | null>(null);
  const [subjectSectionTop, setSubjectSectionTop] = useState<number | null>(null);
  const [subjectGridTop, setSubjectGridTop] = useState<number | null>(null);
  const [subjectCardTops, setSubjectCardTops] = useState<Record<string, number>>({});
  const [difficultySectionTop, setDifficultySectionTop] = useState<number | null>(null);
  const [difficultyGridTop, setDifficultyGridTop] = useState<number | null>(null);
  const [difficultyCardTops, setDifficultyCardTops] = useState<Record<string, number>>({});
  const horizontalPadding = windowWidth < 600 ? 20 : 40;
  const availableWindowWidth = windowWidth - (windowWidth >= 768 ? 16 : 0);
  const contentWidth = Math.min(availableWindowWidth, 1080) - horizontalPadding * 2;
  const columns = contentWidth >= 900 ? 3 : contentWidth >= 560 ? 2 : 1;
  const cardGap = 14;
  const cardWidth = (contentWidth - cardGap * (columns - 1)) / columns;

  useEffect(() => {
    const animation = Animated.timing(entrance, {
      toValue: 1,
      duration: 450,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: Platform.OS !== 'web',
    });
    animation.start();

    return () => animation.stop();
  }, [entrance]);

  function startQuiz() {
    const parsedQuestionCount = Number(questionCount);
    if (!Number.isInteger(parsedQuestionCount) || parsedQuestionCount < 1 || parsedQuestionCount > 50) {
      setQuestionCountError('Choose a whole number from 1 to 50.');
      return;
    }

    setQuestionCountError(null);
    router.push({
      pathname: './quiz',
      params: {
        categoryId: selectedCategoryId,
        difficulty: selectedDifficulty,
        amount: String(parsedQuestionCount),
      },
    });
  }

  function adjustQuestionCount(change: number) {
    const currentCount = Number(questionCount) || 5;
    const nextCount = Math.min(50, Math.max(1, currentCount + change));
    setQuestionCount(String(nextCount));
    setQuestionCountError(null);
  }

  function getCardScrollStyle(absoluteTop: number, index: number) {
    const drift = 72 + (index % 3) * 8;
    const parallax = scrollY.interpolate({
      inputRange: [-windowHeight, windowHeight],
      outputRange: [drift, -drift],
      extrapolate: 'clamp',
    });

    return {
      transform: [{ translateY: parallax }],
    };
  }

  function getSubjectScrollStyle(subjectId: string, index: number) {
    const cardTop = subjectCardTops[subjectId];
    if (subjectSectionTop === null || subjectGridTop === null || cardTop === undefined) {
      return undefined;
    }

    const absoluteTop = subjectSectionTop + subjectGridTop + cardTop;
    const shouldReveal = absoluteTop > windowHeight * 0.9;
    const parallaxStyle = getCardScrollStyle(absoluteTop, index);
    const reveal = shouldReveal
      ? scrollY.interpolate({
          inputRange: [absoluteTop - windowHeight * 0.86, absoluteTop - windowHeight * 0.46],
          outputRange: [0, 1],
          extrapolate: 'clamp',
        })
      : null;
    const parallax = parallaxStyle.transform[0].translateY;

    return {
      opacity: reveal ?? 1,
      transform: [
        {
          translateY: reveal
            ? Animated.add(
                parallax,
                reveal.interpolate({
                  inputRange: [0, 1],
                  outputRange: [18, 0],
                }),
              )
            : parallax,
        },
      ],
    };
  }

  function getDifficultyScrollStyle(difficultyId: string, index: number) {
    const cardTop = difficultyCardTops[difficultyId];
    if (
      difficultySectionTop === null ||
      difficultyGridTop === null ||
      cardTop === undefined
    ) {
      return undefined;
    }

    const absoluteTop = difficultySectionTop + difficultyGridTop + cardTop;
    return getCardScrollStyle(absoluteTop, index);
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <Animated.ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingHorizontal: horizontalPadding },
        ]}
        style={[
          styles.entrance,
          {
            opacity: entrance,
            transform: [
              {
                translateY: entrance.interpolate({
                  inputRange: [0, 1],
                  outputRange: [12, 0],
                }),
              },
            ],
          },
        ]}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
          useNativeDriver: Platform.OS !== 'web',
        })}
        scrollEventThrottle={16}>
        <View style={styles.topBar}>
          <View style={styles.brand}>
            <View style={styles.brandMark}>
              <Text style={styles.brandMarkText}>?</Text>
            </View>
            <Text style={styles.brandName}>CURIO</Text>
          </View>
          <View style={styles.subjectCountPill}>
            <View style={styles.liveDot} />
            <Text style={styles.subjectCountText}>15 SUBJECTS</Text>
          </View>
        </View>

        <View style={styles.hero}>
          <View style={styles.heroDecorationLarge} />
          <View style={styles.heroDecorationSmall} />
          <View style={styles.heroCopy}>
            <Text style={styles.eyebrow}>YOUR NEXT LITTLE DISCOVERY</Text>
            <Text style={[styles.title, { fontSize: windowWidth < 600 ? 36 : 46 }]}>
              Make room for{'\n'}a curious mind.
            </Text>
            <Text style={styles.intro}>
              A few thoughtful questions can take you somewhere unexpected.
            </Text>
          </View>
          <View style={styles.heroFoot}>
            <Text style={styles.heroFootLabel}>PICK A PATH</Text>
            <Text style={styles.heroFootArrow}>↓</Text>
          </View>
        </View>

        <View
          style={styles.section}
          onLayout={(event) => setSubjectSectionTop(event.nativeEvent.layout.y)}>
          <View style={styles.sectionHeading}>
            <View style={styles.stepBadge}>
              <Text style={styles.stepBadgeText}>01</Text>
            </View>
            <View style={styles.sectionHeadingCopy}>
              <Text style={styles.sectionTitle}>Choose your subject</Text>
              <Text style={styles.sectionHint}>Pick something that sparks your curiosity.</Text>
            </View>
          </View>

          <View
            style={[styles.options, { gap: cardGap }]}
            onLayout={(event) => setSubjectGridTop(event.nativeEvent.layout.y)}>
            {subjects.map((subject, index) => {
              const isSelected = selectedCategoryId === subject.categoryId;

              return (
                <Animated.View
                  key={subject.categoryId}
                  onLayout={(event) => {
                    const top = event.nativeEvent.layout.y;
                    setSubjectCardTops((current) =>
                      current[subject.categoryId] === top
                        ? current
                        : { ...current, [subject.categoryId]: top },
                    );
                  }}
                  style={[
                    styles.optionShell,
                    { width: cardWidth },
                    getSubjectScrollStyle(subject.categoryId, index),
                  ]}>
                  <Pressable
                    accessibilityRole="radio"
                    accessibilityState={{ selected: isSelected }}
                    onPress={() => setSelectedCategoryId(subject.categoryId)}
                    style={({ pressed }) => [
                      styles.option,
                      isSelected && styles.optionSelected,
                      pressed && styles.optionPressed,
                    ]}>
                    <View style={[styles.subjectMark, isSelected && styles.subjectMarkSelected]}>
                      <Text style={[styles.subjectMarkText, isSelected && styles.subjectMarkTextSelected]}>
                        {String(index + 1).padStart(2, '0')}
                      </Text>
                    </View>
                    <View style={styles.optionCopy}>
                      <Text style={[styles.optionTitle, isSelected && styles.optionTitleSelected]}>
                        {subject.title}
                      </Text>
                      <Text style={styles.optionSubtitle}>{subject.subtitle}</Text>
                    </View>
                    <View style={[styles.radio, isSelected && styles.radioSelected]}>
                      {isSelected ? <View style={styles.radioDot} /> : null}
                    </View>
                  </Pressable>
                </Animated.View>
              );
            })}
          </View>
        </View>

        <View
          style={styles.section}
          onLayout={(event) => setDifficultySectionTop(event.nativeEvent.layout.y)}>
          <View style={styles.sectionHeading}>
            <View style={styles.stepBadge}>
              <Text style={styles.stepBadgeText}>02</Text>
            </View>
            <View style={styles.sectionHeadingCopy}>
              <Text style={styles.sectionTitle}>Set your difficulty</Text>
              <Text style={styles.sectionHint}>
                Choose the challenge that feels right for you.
              </Text>
            </View>
          </View>

          <View
            style={[styles.difficulties, { gap: cardGap }]}
            onLayout={(event) => setDifficultyGridTop(event.nativeEvent.layout.y)}>
            {difficulties.map((difficulty, index) => {
              const isSelected = selectedDifficulty === difficulty.value;

              return (
                <Animated.View
                  key={difficulty.value}
                  onLayout={(event) => {
                    const top = event.nativeEvent.layout.y;
                    setDifficultyCardTops((current) =>
                      current[difficulty.value] === top
                        ? current
                        : { ...current, [difficulty.value]: top },
                    );
                  }}
                  style={[
                    { width: cardWidth },
                    getDifficultyScrollStyle(difficulty.value, index),
                  ]}>
                  <Pressable
                    accessibilityRole="radio"
                    accessibilityState={{ selected: isSelected }}
                    onPress={() => setSelectedDifficulty(difficulty.value)}
                    style={({ pressed }) => [
                      styles.difficultyOption,
                      isSelected && styles.difficultyOptionSelected,
                      pressed && styles.optionPressed,
                    ]}>
                    <View style={styles.difficultyTopLine}>
                      <View
                        style={[
                          styles.difficultyMark,
                          isSelected && styles.difficultyMarkSelected,
                        ]}>
                        <Text
                          style={[
                            styles.difficultyMarkText,
                            isSelected && styles.difficultyMarkTextSelected,
                          ]}>
                          0{index + 1}
                        </Text>
                      </View>
                      {isSelected ? <Text style={styles.selectedLabel}>SELECTED</Text> : null}
                    </View>
                    <View>
                      <Text
                        style={[
                          styles.difficultyTitle,
                          isSelected && styles.difficultyTitleSelected,
                        ]}>
                        {difficulty.title}
                      </Text>
                      <Text style={styles.difficultySubtitle}>{difficulty.subtitle}</Text>
                    </View>
                  </Pressable>
                </Animated.View>
              );
            })}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeading}>
            <View style={styles.stepBadge}>
              <Text style={styles.stepBadgeText}>03</Text>
            </View>
            <View style={styles.sectionHeadingCopy}>
              <Text style={styles.sectionTitle}>Choose your session length</Text>
              <Text style={styles.sectionHint}>Set anywhere from 1 to 50 questions.</Text>
            </View>
          </View>
          <View style={styles.countField}>
            <TextInput
              accessibilityLabel="Number of questions"
              keyboardType="number-pad"
              maxLength={2}
              onChangeText={(value) => {
                setQuestionCount(value.replace(/[^0-9]/g, ''));
                setQuestionCountError(null);
              }}
              onBlur={() => {
                if (questionCount === '') {
                  setQuestionCount('5');
                }
              }}
              value={questionCount}
              style={styles.countInput}
            />
            <Text style={styles.countSuffix}>questions</Text>
            <View style={styles.countStepper}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Increase question count"
                onPress={() => adjustQuestionCount(1)}
                style={({ pressed }) => [styles.stepperButton, pressed && styles.optionPressed]}>
                <Text style={styles.stepperArrow}>▲</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Decrease question count"
                onPress={() => adjustQuestionCount(-1)}
                style={({ pressed }) => [styles.stepperButton, pressed && styles.optionPressed]}>
                <Text style={styles.stepperArrow}>▼</Text>
              </Pressable>
            </View>
          </View>
          {questionCountError ? (
            <Text accessibilityRole="alert" style={styles.countError}>
              {questionCountError}
            </Text>
          ) : null}
        </View>

        <View style={styles.actions}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Start ${questionCount} ${selectedDifficulty} quiz`}
            onPress={startQuiz}
            style={({ pressed }) => [styles.startButton, pressed && styles.buttonPressed]}>
            <Text style={styles.startButtonText}>Start Quiz · {questionCount}</Text>
            <Text style={styles.startArrow}>→</Text>
          </Pressable>
          <Text style={styles.footer}>
            {subjects.find((subject) => subject.categoryId === selectedCategoryId)?.title} ·{' '}
            {difficulties.find((difficulty) => difficulty.value === selectedDifficulty)?.title} ·{' '}
            Your pace
          </Text>
          <Text style={styles.levelDisclaimer}>
            Difficulty labels describe general trivia and do not correspond to school grade levels
            or curriculum.
          </Text>
        </View>
      </Animated.ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F5F7F3',
  },
  content: {
    flexGrow: 1,
    width: '100%',
    maxWidth: 1080,
    alignSelf: 'center',
    paddingTop: 24,
    paddingBottom: 48,
  },
  entrance: {
    flex: 1,
  },
  topBar: {
    minHeight: 38,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  brandMark: {
    width: 36,
    height: 36,
    borderRadius: 13,
    backgroundColor: '#E5ECD9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandMarkText: {
    color: '#244A3D',
    fontSize: 20,
    fontWeight: '800',
  },
  brandName: {
    color: '#244A3D',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 2.4,
  },
  subjectCountPill: {
    minHeight: 34,
    paddingHorizontal: 12,
    borderRadius: 18,
    backgroundColor: '#EAF0E8',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#6E8C62',
  },
  subjectCountText: {
    color: '#587066',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  hero: {
    position: 'relative',
    minHeight: 290,
    marginTop: 28,
    marginBottom: 36,
    borderRadius: 28,
    paddingHorizontal: 34,
    paddingVertical: 30,
    backgroundColor: '#244A3D',
    overflow: 'hidden',
    justifyContent: 'space-between',
  },
  heroCopy: {
    maxWidth: 650,
    zIndex: 1,
  },
  eyebrow: {
    color: '#BCD0B9',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: 15,
  },
  title: {
    color: '#F9FBF6',
    fontSize: 46,
    fontWeight: '700',
    letterSpacing: -1.8,
    lineHeight: 1.12 * 46,
  },
  intro: {
    color: '#D2DED5',
    fontSize: 15,
    lineHeight: 23,
    maxWidth: 390,
    marginTop: 14,
  },
  heroFoot: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 22,
  },
  heroFootLabel: {
    color: '#D2DED5',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.4,
  },
  heroFootArrow: {
    color: '#D2DED5',
    fontSize: 20,
    fontWeight: '500',
  },
  heroDecorationLarge: {
    position: 'absolute',
    width: 310,
    height: 310,
    right: -105,
    top: -128,
    borderRadius: 155,
    borderWidth: 1,
    borderColor: 'rgba(221, 237, 222, 0.12)',
  },
  heroDecorationSmall: {
    position: 'absolute',
    width: 205,
    height: 205,
    right: -34,
    top: -34,
    borderRadius: 110,
    backgroundColor: 'rgba(195, 218, 190, 0.07)',
  },
  section: {
    marginBottom: 34,
  },
  sectionHeading: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 13,
    marginBottom: 17,
  },
  stepBadge: {
    width: 38,
    height: 38,
    borderRadius: 13,
    backgroundColor: '#E5ECD9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBadgeText: {
    color: '#456456',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  sectionHeadingCopy: {
    flex: 1,
  },
  sectionTitle: {
    color: '#244A3D',
    fontSize: 21,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  sectionHint: {
    color: '#737C76',
    fontSize: 13,
    lineHeight: 19,
    marginTop: 3,
  },
  options: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'stretch',
  },
  optionShell: {
    minWidth: 0,
  },
  option: {
    minHeight: 88,
    borderWidth: 1,
    borderColor: '#E3E8DF',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    backgroundColor: '#FFFFFF',
    shadowColor: '#233F32',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.045,
    shadowRadius: 10,
    elevation: 1,
  },
  optionSelected: {
    borderColor: '#537667',
    backgroundColor: '#EEF3EC',
    shadowOpacity: 0.1,
    elevation: 2,
  },
  optionPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.985 }],
  },
  subjectMark: {
    width: 38,
    height: 38,
    flexShrink: 0,
    borderRadius: 13,
    backgroundColor: '#F0F3ED',
    alignItems: 'center',
    justifyContent: 'center',
  },
  subjectMarkSelected: {
    backgroundColor: '#DDE8D8',
  },
  subjectMarkText: {
    color: '#788A7E',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  subjectMarkTextSelected: {
    color: '#244A3D',
  },
  optionCopy: {
    flex: 1,
    gap: 5,
    minWidth: 0,
  },
  optionTitle: {
    color: '#34433D',
    fontSize: 14,
    fontWeight: '700',
  },
  optionTitleSelected: {
    color: '#244A3D',
  },
  optionSubtitle: {
    color: '#737C76',
    fontSize: 11,
    lineHeight: 15,
  },
  radio: {
    width: 20,
    height: 20,
    flexShrink: 0,
    borderRadius: 10,
    borderWidth: 1.4,
    borderColor: '#C9D0C9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: {
    borderColor: '#244A3D',
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#244A3D',
  },
  difficulties: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'stretch',
  },
  difficultyOption: {
    minWidth: 0,
    minHeight: 142,
    borderWidth: 1,
    borderColor: '#E3E8DF',
    borderRadius: 18,
    paddingHorizontal: 18,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    justifyContent: 'space-between',
    shadowColor: '#233F32',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.045,
    shadowRadius: 10,
    elevation: 1,
  },
  difficultyOptionSelected: {
    borderColor: '#537667',
    backgroundColor: '#EEF3EC',
    shadowOpacity: 0.1,
    elevation: 2,
  },
  difficultyTopLine: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  difficultyMark: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: '#F0F3ED',
    alignItems: 'center',
    justifyContent: 'center',
  },
  difficultyMarkSelected: {
    backgroundColor: '#DDE8D8',
  },
  difficultyMarkText: {
    color: '#788A7E',
    fontSize: 10,
    fontWeight: '800',
  },
  difficultyMarkTextSelected: {
    color: '#244A3D',
  },
  selectedLabel: {
    color: '#587B67',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  difficultyTitle: {
    color: '#34433D',
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 5,
  },
  difficultyTitleSelected: {
    color: '#244A3D',
  },
  difficultySubtitle: {
    color: '#737C76',
    fontSize: 12,
    lineHeight: 17,
  },
  countField: {
    minHeight: 62,
    width: 360,
    maxWidth: '100%',
    borderWidth: 1,
    borderColor: '#E3E8DF',
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    overflow: 'hidden',
  },
  countInput: {
    flex: 1,
    minWidth: 0,
    color: '#244A3D',
    fontSize: 18,
    fontWeight: '700',
    paddingVertical: 12,
    paddingHorizontal: 0,
    borderWidth: 0,
    backgroundColor: 'transparent',
  },
  countSuffix: {
    color: '#737C76',
    fontSize: 13,
    marginLeft: 10,
  },
  countStepper: {
    marginLeft: 14,
    borderLeftWidth: 1,
    borderLeftColor: '#E5E7E0',
    paddingLeft: 8,
    alignItems: 'center',
  },
  stepperButton: {
    width: 24,
    height: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperArrow: {
    color: '#244A3D',
    fontSize: 9,
    fontWeight: '700',
  },
  countError: {
    color: '#A64E3E',
    fontSize: 12,
    marginTop: 7,
  },
  actions: {
    marginTop: 2,
    paddingTop: 22,
    borderTopWidth: 1,
    borderTopColor: '#E3E8DF',
  },
  startButton: {
    width: 380,
    maxWidth: '100%',
    minHeight: 60,
    borderRadius: 17,
    paddingHorizontal: 21,
    backgroundColor: '#244A3D',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  buttonPressed: {
    opacity: 0.84,
    transform: [{ scale: 0.99 }],
  },
  startButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.1,
  },
  startArrow: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '500',
  },
  footer: {
    color: '#718078',
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'left',
    marginTop: 14,
  },
  levelDisclaimer: {
    color: '#89948E',
    fontSize: 11,
    lineHeight: 16,
    marginTop: 6,
  },
});
