# Bunnit React Native 과제 구현 리포지토리

## 요구사항 구현

### ✅ Level 1 :

#### React Native 기반 앱을 제작 하시오. 앱 하단에 Bottom Tabs Navigator를 추가하고 4개(홈 / 캘린더 / 라이브러리 / 마이페이지)의 탭을 추가하시오. 추가로 4개의 스크린을 생성하여 각 탭과 연결 하시오.

- [x] Bottom Tabs Navigator: 홈 / 캘린더 / 라이브러리 / 마이페이지 4개 탭

- [x] 각 탭 별 스크린 연결

<br/>

### ✅ Level 2 :

#### 캘린더 탭에 외부 캘린더 라이브러리를 이용하지 않고 캘린더 컴포넌트를 제작하시오. 캘린더는 아래 이미지와 같은 형태로 월 캘린더로 구현하시오

- [x] 외부 캘린더 라이브러리 미사용, 자체 구현

- [x] 현재 월 출력, 오늘 시각적 강조

- [x] 상단 좌/우 버튼으로 전월/익월 이동

- [x] 날짜 탭 시 원형 선택 표시 (마지막 선택만 유효)

<br/>

### ✅ Level 3:

#### react-native-reanimated, react-native-gesture-handler 라이브러리를 이용해서 제스처 이벤트가 발생하면 아래와 같이 캘린더의 형태가 월 캘린더에서 주 캘린더로, 주 캘린더에서 다시 월 캘린더로 변환 가능하도록 구현 하시오

- [x] Reanimated + Gesture Handler 기반 제스처

- [x] 위/아래 드래그로 월 → 주, 주 → 월 자연 전환

- [x] 전환 도중 레이스 컨디션 방지, 스냅 애니메이션 적용

<br/>

### ✅ 부가 구현사항:

- [x] 좌우 스와이프 가능한 무한 스크롤 링버퍼 캘린더
- [x] 달력 인덱스의 좌우 끝에서 센터 재배치(teleport) 시 딜레이 및 인터랙션 안정화
- [x] 스와이프 애니메이션 중 추가 스와이핑 못하게 애니메이션 사이 디바운스 처리
- [x] 접근성 라벨
- [x] 탭 인디케이터 실시간 동기화
- [x] 오늘로 바로 돌아가기 버튼 추가 (우상단)

<br/>

## 기술 스택

React Native (TypeScript)

Navigation: @react-navigation/bottom-tabs

애니메이션/제스처: react-native-reanimated, react-native-gesture-handler

유틸: dayjs

아이콘: react-native-vector-icons

스타일: RN StyleSheet

<br/>

## 프로젝트 구조

```
src/
  components/
    common/
      pressableBase/          # 공통 프레서블 래퍼(스케일/opacity, debounce)
    screens/
      ...                     # 스크린에 귀속된 컴포넌트들

  screens/
    HomeScreen/
    CalendarScreen/
      CollapsibleCalendarTabs.tsx
      SwipeMonthCalendarInfinite.tsx
      SwipeWeekCalendarInfinite.tsx
      Tabs/
        DietTab.tsx
        WorkoutTab.tsx
        BodyTab.tsx
    LibraryScreen/
    MyPageScreen/

  constants/
    layout.ts                 # SIDE_PAD 등 공통 레이아웃

  hook/
    useTabAnimateStyle.ts     # 탭 텍스트 컬러/스케일 애니메이션
```

<br/>

## 실행 방법

```
1) 의존성 설치
# iOS 준비
cd ios && pod install && cd ..

# 공통
npm install

2) 개발 실행
# iOS
npm run ios

# Android
npm run android
```

\*시뮬레이터 권장: iPhone 15(표준), iPhone SE(작은 화면), iPhone 15 Pro Max(큰 화면)

<br/>

## 주요 구현 상세

### 1. 캘린더 코어

- 링 버퍼형 FlatList: WINDOW 고정 페이지 내에서 좌/우 스와이프 시 가장자리에 근접하면 센터 재배치(teleport) 로 인덱스/기준 오프셋을 재정렬 → 이질감 없는 “무한 스크롤” 느낌

- 센터 재배치 중 스와이프 잠금: scrollEnabled를 일시적으로 false 처리하여 충돌/되돌림 방지

- 전/익 이동 버튼: goPrevMonth/NextMonth, goPrevWeek/NextWeek

- 쿨다운(디바운스): 연타/연속 제스처로 이중 이동되는 문제를 NAV_COOLDOWN 으로 해결

### 2. 월 ⇄ 주 전환

- 상단 캘린더 컨테이너의 height를 Reanimated interpolate로 제어

- 진행도 0: 월(6행), 진행도 1: 주(1행)

- Gesture.Pan()의 translationY로 진행도를 계산, 임계값/속도로 최종 상태 결정

- 모드 전환 시 각 캘린더의 opacity 보정. 자연스러운 fade-in-out 효과 연출

### 3. 날짜 선택/오늘 강조

- dayjs로 날짜 비교(isSame, isToday)

- 선택된 날짜는 원형 배경, 오늘은 테두리 강조

4. 페이지 하단 PagerView 탭

   - flex: 1으로 캘린더 높이가 동적으로 확장/축소 시 남은 여백을 점유하도록 설정

   - FlatList로 식단/신체/운동 정보를 보여주도록 구성. (동적으로 데이터 추가/삭제/수정까지 추가까진 진행하지 않음.)

   - onPageScroll의 position + offset 값을 인디케이터에 실시간 반영 → 스와이프와 동시성

   - 탭 문구는 interpolateColor로 활성 흰색 ↔ 비활성 검정 블렌딩
