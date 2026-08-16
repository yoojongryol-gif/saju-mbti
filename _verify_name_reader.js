/**
 * node 유닛 검증 스크립트 (일회성, 배포에는 포함하지 않음)
 * - 81수리표 전량 존재/구조 검사
 * - 결정성(같은 입력 → 같은 출력) 검사
 * - 획수/4격 공식 대조: 공개된 순한글 성명학 사례가 희소하여, 본 앱이 채택한 획수표 기준으로
 *   수기 계산한 값과 엔진 출력값을 대조하는 방식으로 1차 검증한다 (코드 주석에도 명시).
 */
var NameReader = require('./name-reader.js');
var assert = require('assert');

var fails = 0;
function check(label, cond) {
  if (cond) { console.log('PASS ' + label); }
  else { console.log('FAIL ' + label); fails++; }
}

// ---- 1. 81수리표 전량 존재 + 구조 검사 ----
var suriKeys = Object.keys(NameReader._internal.SURI_TABLE).map(Number).sort(function (a, b) { return a - b; });
check('81수리표 개수 = 81', suriKeys.length === 81);
check('81수리표 범위 1~81 연속', suriKeys[0] === 1 && suriKeys[80] === 81 &&
  suriKeys.every(function (n, i) { return n === i + 1; }));

var gradeSet = { 길: 0, 중길: 0, 평: 0, 흉: 0 };
var structOk = true;
Object.keys(NameReader._internal.SURI_TABLE).forEach(function (k) {
  var e = NameReader._internal.SURI_TABLE[k];
  if (!e.name || typeof e.name !== 'string') structOk = false;
  if (!gradeSet.hasOwnProperty(e.grade)) structOk = false;
  else gradeSet[e.grade]++;
  if (!e.s1 || typeof e.s1 !== 'string' || e.s1.length < 5) structOk = false;
});
check('81수리표 각 항목 {name,grade,s1} 구조 정상', structOk);
check('81수리표 grade 4종류 모두 사용됨', gradeSet.길 > 0 && gradeSet.중길 > 0 && gradeSet.평 > 0 && gradeSet.흉 > 0);
console.log('  grade 분포:', JSON.stringify(gradeSet));

// 81 초과 순환 검사
check('82 → 2로 순환', NameReader._internal.reduceToSuri(82) === 2);
check('162 → 2로 순환(두 바퀴)', NameReader._internal.reduceToSuri(162) === 2);
check('81은 그대로 81', NameReader._internal.reduceToSuri(81) === 81);

// ---- 2. 결정성 검사 ----
var r1 = NameReader.analyze('김민준', null);
var r2 = NameReader.analyze('김민준', null);
check('결정성: 동일 입력 → 동일 JSON', JSON.stringify(r1) === JSON.stringify(r2));

// ---- 3. 획수/4격 공식 대조 (수기 계산 케이스) ----
// 김(金=1+1+3=5) 민(3+1+1=5) 준(3+2+1=6)
var c1 = NameReader.analyze('김민준', null);
check('김민준 syllables strokes = [5,5,6]',
  c1.syllables[0].strokes === 5 && c1.syllables[1].strokes === 5 && c1.syllables[2].strokes === 6);
check('김민준 원격 raw=11 → num=11(신성격/중길)', c1.suri.wonhyeong.num === 11 && c1.suri.wonhyeong.name === '신성격' && c1.suri.wonhyeong.grade === '중길');
check('김민준 형격 raw=10 → num=10(공허격/흉)', c1.suri.hyeonggyeok.num === 10 && c1.suri.hyeonggyeok.name === '공허격' && c1.suri.hyeonggyeok.grade === '흉');
check('김민준 이격 raw=11 → num=11(신성격/중길)', c1.suri.igyeok.num === 11 && c1.suri.igyeok.name === '신성격');
check('김민준 정격 raw=16 → num=16(덕망격/길)', c1.suri.jeonggyeok.num === 16 && c1.suri.jeonggyeok.name === '덕망격' && c1.suri.jeonggyeok.grade === '길');

// 이(0+1+1=2, jong없음) 서(2+2=4) 준(6)
var c2 = NameReader.analyze('이서준', null);
check('이서준 syllables strokes = [2,4,6]',
  c2.syllables[0].strokes === 2 && c2.syllables[1].strokes === 4 && c2.syllables[2].strokes === 6);
check('이서준 원격 raw=10 → 공허격/흉', c2.suri.wonhyeong.num === 10 && c2.suri.wonhyeong.name === '공허격');
check('이서준 형격 raw=6 → 계성격/중길', c2.suri.hyeonggyeok.num === 6 && c2.suri.hyeonggyeok.name === '계성격');
check('이서준 이격 raw=8 → 개물격/길', c2.suri.igyeok.num === 8 && c2.suri.igyeok.name === '개물격');
check('이서준 정격 raw=12 → 박약격/흉', c2.suri.jeonggyeok.num === 12 && c2.suri.jeonggyeok.name === '박약격');

// 1자 이름 특수규칙: 이도 (이=2, 도=4) → 형격=이격
var c3 = NameReader.analyze('이도', null);
check('이도(1자이름) 원격 raw=4 → 부정격/흉', c3.suri.wonhyeong.num === 4 && c3.suri.wonhyeong.name === '부정격');
check('이도(1자이름) 형격=이격 (raw=6, 계성격/중길)',
  c3.suri.hyeonggyeok.num === 6 && c3.suri.igyeok.num === 6 && c3.suri.hyeonggyeok.name === c3.suri.igyeok.name);
check('이도(1자이름) 정격도 동일 raw=6', c3.suri.jeonggyeok.num === 6);

// 3자 이름: 김하은솔 (김5, 하5, 은3, 솔7)
var c4 = NameReader.analyze('김하은솔', null);
check('김하은솔 syllables strokes = [5,5,3,7]',
  c4.syllables.map(function (s) { return s.strokes; }).join(',') === '5,5,3,7');
check('김하은솔(3자이름) 원격 raw=15(하+은+솔) → 통솔격/중길', c4.suri.wonhyeong.num === 15 && c4.suri.wonhyeong.name === '통솔격');
check('김하은솔 형격 raw=10(김+하) → 공허격/흉', c4.suri.hyeonggyeok.num === 10 && c4.suri.hyeonggyeok.name === '공허격');
check('김하은솔 이격 raw=12(김+솔,끝자) → 박약격/흉', c4.suri.igyeok.num === 12 && c4.suri.igyeok.name === '박약격');
check('김하은솔 정격 raw=20(김+전체) → 허망격/흉', c4.suri.jeonggyeok.num === 20 && c4.suri.jeonggyeok.name === '허망격');

// ---- 4. 소리오행/흐름 구조 검사 ----
check('소리오행: 초성 매핑 규약(ㄱ=목,ㄴ=화,ㅇ=토,ㅅ=금,ㅁ=수) 일치',
  NameReader._internal.CONSONANT_ELEMENT['ㄱ'] === '목' &&
  NameReader._internal.CONSONANT_ELEMENT['ㄴ'] === '화' &&
  NameReader._internal.CONSONANT_ELEMENT['ㅇ'] === '토' &&
  NameReader._internal.CONSONANT_ELEMENT['ㅅ'] === '금' &&
  NameReader._internal.CONSONANT_ELEMENT['ㅁ'] === '수');
check('soriFlow.pairs 개수 = 음절수-1', c1.soriFlow.pairs.length === c1.syllables.length - 1);
check('soriFlow.verdict/para 존재', typeof c1.soriFlow.verdict === 'string' && typeof c1.soriFlow.para === 'string');

// ---- 5. sajuFit: chart 있음/없음 분기 ----
check('chart 없으면 sajuFit=null', c1.sajuFit === null);
var fakeChart = { elements: { 목: 0, 화: 3, 토: 2, 금: 1, 수: 2 } }; // 목이 최소
var c5 = NameReader.analyze('이서준', fakeChart); // 이(ㅇ=토),서(ㅅ=금),준(ㅈ=금) → 목 없음
check('sajuFit 존재(chart 있을 때)', c5.sajuFit !== null);
check('sajuFit.lackElement = 목 (최소 오행)', c5.sajuFit.lackElement === '목');
check('sajuFit.fillsLack = false (이서준엔 목 소리 없음)', c5.sajuFit.fillsLack === false);

var fakeChart2 = { elements: { 목: 3, 화: 3, 토: 0, 금: 2, 수: 2 } }; // 토가 최소
var c6 = NameReader.analyze('이서준', fakeChart2); // 이=ㅇ=토 있음
check('sajuFit.fillsLack = true (이서준의 "이"=토 소리 보유)', c6.sajuFit.fillsLack === true);

// ---- 6. overall 구조/범위 ----
check('overall.score 0~100 범위', c1.overall.score >= 0 && c1.overall.score <= 100);
check('overall.headline/para 존재', typeof c1.overall.headline === 'string' && typeof c1.overall.para === 'string');

// ---- 7. 입력 검증 ----
check('isValidName("김")=false(1자)', NameReader.isValidName('김') === false);
check('isValidName("김민준")=true', NameReader.isValidName('김민준') === true);
check('isValidName("김민준서")=true(4자)', NameReader.isValidName('김민준서') === true);
check('isValidName("김민준서율")=false(5자)', NameReader.isValidName('김민준서율') === false);
check('isValidName("kim민준")=false(비한글 혼입)', NameReader.isValidName('kim민준') === false);
check('analyze("김")은 에러 throw', (function () {
  try { NameReader.analyze('김', null); return false; } catch (e) { return true; }
})());

console.log('\n총 실패: ' + fails);
process.exit(fails > 0 ? 1 : 0);
