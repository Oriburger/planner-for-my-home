# 저축 예상액 계산기 (Planner for my home)

현재 자산·수입·지출을 입력하면 **n년 후 저축 예상액과 순자산**을 계산해 시각화하는
반응형 대시보드입니다. 모바일 우선으로 설계했고, PC 에서는 좌측 입력 / 우측 결과의
2열 대시보드로 확장됩니다.

## 실행

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # 프로덕션 빌드
npm run test     # 시뮬레이션 로직 단위 테스트
npm run lint     # 타입 체크
```

## 배포

`main` 브랜치에 push 되면 `.github/workflows/deploy.yml` 이 자동으로 빌드해
GitHub Pages 에 배포합니다 (저장소 Settings → Pages → Source 를 "GitHub Actions"
로 설정해야 합니다). `vite.config.ts` 의 `base` 는 저장소 이름
(`/planner-for-my-home/`)으로 고정되어 있습니다.

## 기술 스택

| 영역 | 선택 | 이유 |
|---|---|---|
| 프레임워크 | React 18 + TypeScript + Vite | 서버가 필요 없는 순수 클라이언트 계산기라 Next.js 대신 Vite 로 가볍게 구성 |
| 스타일링 | Tailwind CSS | 반응형 분기와 토큰(블루/그레이)을 한 파일에서 관리 |
| 상태 관리 | Zustand (+ persist) | 보일러플레이트 없이 슬라이스 단위 구독이 가능해 입력 폼 리렌더가 최소화됨. `localStorage` 자동 저장 |
| 차트 | Recharts | 반응형 컨테이너와 합성(Composed) 차트 지원 |

## 디렉토리 구조 & 컴포넌트 트리

```
planner-for-my-home/
├── index.html
├── vite.config.ts / tailwind.config.js / postcss.config.js / tsconfig.json
└── src/
    ├── main.tsx                    # 엔트리
    ├── App.tsx
    ├── index.css                   # Tailwind + 슬라이더/기본 스타일
    │
    ├── types/
    │   └── planner.ts              # ★ 전체 도메인 모델 (자산·수입·주거·대출·지출·결과)
    │
    ├── store/
    │   ├── plannerStore.ts         # ★ Zustand store + 항목 팩토리 + 기본 시나리오 (persist)
    │   └── uiStore.ts              # 화면 모드(PC/모바일/자동) + 다크모드 (persist)
    │
    ├── hooks/
    │   └── useSimulation.ts        # 입력 변경 시에만 재계산 (useMemo)
    │
    ├── utils/
    │   ├── simulation.ts           # ★ 연도별 시뮬레이션 엔진
    │   ├── loan.ts                 # 상환 방식별 월 단위 상환 스케줄
    │   ├── tax.ts                  # 세금·4대보험 간이 추정
    │   ├── format.ts               # 원/만원/억 포맷터
    │   └── __tests__/
    │       └── simulation.test.ts  # 22개 단위 테스트
    │
    └── components/
        ├── layout/
        │   ├── DashboardLayout.tsx     # ★ 반응형 대시보드 골격
        │   ├── AppHeader.tsx           # 상단 고정 헤더
        │   ├── AppFooter.tsx           # 화면 모드 · 다크모드 전환
        │   └── MobileSummaryBar.tsx    # 모바일 하단 고정 결과 요약 바
        │
        ├── ui/                          # 디자인 시스템 프리미티브
        │   ├── Card.tsx                 # Card / CardHeader
        │   ├── Accordion.tsx            # 카테고리별 접이식 섹션
        │   ├── Fields.tsx               # Field / MoneyInput / PercentInput /
        │   │                            # CountInput / TextInput / Select /
        │   │                            # Toggle / SegmentedControl
        │   └── ItemCard.tsx             # ItemCard / AddItemButton / EmptyState
        │
        ├── form/                        # 좌측(모바일 상단) 입력 패널
        │   ├── InputPanel.tsx           # 섹션 조립 + 초기화
        │   ├── PeriodSection.tsx        # 기간 슬라이더 + 전역 가정치
        │   ├── AssetSection.tsx         # 현재 보유 자산
        │   ├── IncomeSection.tsx        # 수입 (+ 연도별 인상률 수동 입력 그리드)
        │   ├── HousingSection.tsx       # 거주 비용
        │   ├── LoanSection.tsx          # 대출
        │   └── ExpenseSection.tsx       # 월 고정 지출
        │
        └── result/                      # 우측(모바일 하단) 결과 패널
            ├── ResultPanel.tsx
            ├── SummaryCards.tsx         # 요약 스탯 타일
            ├── AssetChart.tsx           # 총자산/순자산/대출잔액 추이
            ├── CashflowChart.tsx        # 연간 현금흐름 누적 막대
            ├── YearTable.tsx            # 연도별 상세 표 (차트의 대체 뷰)
            ├── ChartTooltip.tsx
            └── chartTheme.ts            # 차트 색 슬롯 · 축/그리드 토큰
```

## 시뮬레이션 로직

`src/utils/simulation.ts` 의 `runSimulation(data)` 이 1년 단위로 아래를 반복합니다.

```
당해 총자산 = 이전 총자산
            + 자산 운용수익 (연초 잔액 기준 복리, 토글로 on/off)
            + (당해 세전수입 - 세금/4대보험)
            - 연간 고정지출
            - 연간 주거비
            - 대출 상환액(원금 + 이자)

순자산 = 총자산 - 대출 잔액
```

세부 규칙:

- **연봉 인상률은 복리**로 누적됩니다. `고정 비율` 모드는 `(1 + r)^n`, `연도별 입력`
  모드는 입력한 인상률을 순차 적용하고 배열이 짧으면 마지막 값을 이어 씁니다.
  `커스텀` 모드는 인상률이 아니라 연차별 금액 자체를 직접 지정하며, 배열이 짧으면
  마지막 값을 이어 씁니다.
- **지출·주거비**도 각각의 상승률로 복리 증가합니다. 지출은 항목별 상승률을 비우면
  전역 물가상승률을 따릅니다.
- **대출**은 월 단위로 상환 스케줄을 돌려 연 합계를 냅니다. 원리금균등 / 원금균등 /
  만기일시 / 월 상환액 직접입력을 지원하고, 시작·종료 연차·거치 기간(이자만 납부)을
  지정할 수 있습니다. 만기일시상환은 "만기 자동 연장" 토글로 버팀목 대출처럼 만기
  후에도 이자만 계속 낼 수 있고, "보증금 상환 연동"을 켜면 원금 상환이 유동 현금이
  아닌 보증금 자산에서 상쇄됩니다.
- **자산은 시작 연차를 지정**할 수 있어 "3년차부터 새 적금 가입" 같은 시나리오를
  표현합니다. 시작 전에는 총자산에 포함되지 않고, 시작 연차에 최초 평가액이
  여유자금에서 이동합니다. 연금·적금·청약 등은 만기(수령) 연차/나이도 지정할 수
  있고, 만기 시 자동이체가 중단되며 유동자산으로 전환됩니다.
- **월 자동이체는 그 해 저축 여력(연 저축액 + 여유자금)을 넘지 않도록 비례 축소**
  됩니다. 감당 못 하는 금액까지 이체하면 여유자금이 빚처럼 마이너스 복리로
  불어나 총자산이 줄어드는 비현실적인 결과가 생기기 때문입니다.
- **보증금은 순자산에 중립적**입니다. 2년차 이후 시작하는 계약의 보증금은 해당
  연차에 여유자금(유동)에서 빠져 묶인 자산(비유동)으로 이동하고, 계약 종료 다음
  해에 되돌아옵니다. 그래서 결과에 `유동자산 / 비유동자산`을 나눠 표시합니다.
- **세금·4대보험**은 연봉 구간별 실효 공제율 테이블을 선형 보간해 추정합니다
  (`utils/tax.ts`). 정확한 연말정산 계산기가 아니라 장기 추세용 근사치이며,
  `공제율 직접입력` 모드로 단일 비율을 강제할 수 있습니다.

## 주요 기능

- **동적 항목 추가/삭제/복제** — 자산·수입·주거·대출·지출 모두 `항목 추가` 버튼으로
  새 타입을 만들고, 각 항목의 시작/종료 연차를 지정해 "3년차부터 월세로 이사",
  "5년차에 부수입 종료" 같은 시나리오를 표현할 수 있습니다.
- **메모** — 모든 항목에 자유 서술 메모를 남길 수 있습니다.
- **기간 조절** — 슬라이더(1~40년) + 프리셋 버튼(5/10/20/30년), 기본 10년.
- **화면 모드 / 다크모드** — 하단 푸터에서 PC·모바일·자동 표시 모드와 다크모드를
  전환할 수 있습니다.
- **자동 저장** — 입력값은 `localStorage` 에 저장되어 새로고침해도 유지됩니다.
- **실시간 재계산** — 입력이 바뀌면 `useMemo` 로 시뮬레이션만 다시 돌립니다.

## 차트 색상

카테고리 색은 검증된 고정 슬롯 순서(blue → orange → aqua → yellow)로만 배정하며
순환하지 않습니다. 대시보드 표면(`#ffffff`) 기준으로 색각이상 분리도(worst adjacent
ΔE 9.1)와 일반 시야 분리도(ΔE 22.9) 검사를 통과한 조합이고, 표면 대비가 3:1 미만인
슬롯이 있어 **연도별 상세 표**를 항상 대체 뷰로 함께 제공합니다.

## 면책

세금·물가·수익률 등 모든 가정값은 단순화된 추정치입니다. 실제 재무 판단에 사용하기
전에 반드시 개별 확인이 필요합니다.
