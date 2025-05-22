
//各列ごとに存在する座席の開始番号と終了番号
// （例：A列は10番から26番までが存在する）
const seatRules = {
  A: [10, 26],
  B: [5, 31],
  C: [4, 32],
  D: [3, 33],
  E: [3, 33],
  F: [2, 34],
  G: [2, 34],
  H: [1, 35],
  J: [1, 35],
  K: [1, 35],
  L: [3, 33],
  M: [1, 35],
  N: [1, 35],
  P: [1, 35],
  Q: [3, 33],
  R: [3, 33],
  S: [5, 31],
  T: [8, 28],
  U: [8, 28],
  V: [10, 26],
  W: [10, 26],
}

//seatRulesのうち、座席が存在しない番号
const seatExcludes = {
  B: [26],
  D: [26],
  F: [26],
  H: [26],
  K: [26],
}


//それぞれの列のアルファベットの配列をつくる
const rows = "ABCDEFGHJKLMNPQRSTUVW".split("");
const aisleBoundaries = [9, 26];//次の番号との間に通路がある座席
const allSeats = [];//全座席

//座席ルールに従い、存在しない座席を除外して、座席全体の集合（オブジェクト）を作る。
for (const row in seatRules) {
  const [start, end] = seatRules[row];
  const excluded = seatExcludes[row] || [];

  for (let num = start; num <= end; num++) {
    if (excluded.includes(num)) {
      continue;
    } else {
      const id = `${row}${num}`;

      const isAisle = aisleBoundaries.includes(num);
      const isGoodSeat = "ABCDEFG".includes(row) && num >= 10 && num <= 26;

      let group = "";
      if ("ABCDEFGHJKL".includes(row)) {
        if (num <= 9) group = "前方左";
        else if (num <= 26) group = "前方中央";
        else group = "前方右";
      } else if ("MNPQRSTUVW".includes(row)) {
        if (num <= 9) group = "後方左";
        else if (num <= 26) group = "後方中央";
        else group = "後方右";
      }

      allSeats.push({
        id,//例：A10
        row,//例：A
        number: num,//例：10
        isAisle,//右に通路があるかどうか
        isGoodSeat,//良席かどうか
        group: group,//前後左右のどのブロックか
        isAvailable: true//抽選可能か（未発券か）
      });
    }
  }
}

const wheelChairSeats = ['L3', 'L4', 'L32', 'L33'];
const objectiveSeats = allSeats.filter(seat => !wheelChairSeats.includes(seat.id));//抽選対象座席（＝車椅子除外）

console.log('オブジェクト座席集団', objectiveSeats);


//ここからシートマップの描画
const renderedRows = new Set();

for (const seat of allSeats) {
  let parentSelector = "";
  let rowId = "";
  let aisleLeft = "";
  let aisleRight = "";

  if (seat.group === '前方左') {
    parentSelector = '#frontLeft';
    rowId = `FL_row_${seat.row}`;
  } else if (seat.group === '前方中央') {
    parentSelector = '#frontCenter';
    rowId = `FC_row_${seat.row}`;
    aisleLeft = '#FL_aisle';
    aisleRight = '#FR_aisle';
  } else if (seat.group === '前方右') {
    parentSelector = '#frontRight';
    rowId = `FR_row_${seat.row}`;
  } else if (seat.group === '後方左') {
    parentSelector = '#backLeft';
    rowId = `BL_row_${seat.row}`;
  } else if (seat.group === '後方中央') {
    parentSelector = '#backCenter';
    rowId = `BC_row_${seat.row}`;
    aisleLeft = '#BL_aisle';
    aisleRight = '#BR_aisle';
  } else if (seat.group === '後方右') {
    parentSelector = '#backRight';
    rowId = `BR_row_${seat.row}`;
  } else {
    continue;
  }

  if (!renderedRows.has(rowId)) {
    $(parentSelector).append(`<li id="${rowId}" class="row"></li>`);
    if (aisleLeft && aisleRight) {
      $(aisleLeft).append(`<li class="aisle">${seat.row}</li>`);
      $(aisleRight).append(`<li class="aisle">${seat.row}</li>`);
    }
    renderedRows.add(rowId);
  }
  $(`#${rowId}`).append(`<div id="${seat.id}" class="seat">${seat.number}</div>`);
}
//シートマップ描画ここまで

//変数の定義
let issuedSeats = [];//発券された座席
let issuedCount = 0;//発券数をカウントする
let remainedCount = objectiveSeats.length;//残席数をカウントする。初期設定は全座席数


//チケット１枚抽選時の関数定義ここから
function drawSingleSeat() {
  const availableSeats = objectiveSeats.filter(seat => seat.isAvailable);

  if (availableSeats.length === 0) {
    alert('チケットはすべて発券済みです。')
    return;
  }
  const isFan = $("#isFan").prop("checked");
  let seatsPool;
  if (isFan) {
    const fanSeats = [];
    for (const seat of availableSeats) {
      if (seat.isGoodSeat) {
        fanSeats.push(seat, seat, seat);
      } else {
        fanSeats.push(seat);
      }
    }
    seatsPool = fanSeats;
  } else {
    seatsPool = availableSeats;
  }
  console.log('抽選対象オブジェクト', seatsPool);

  const randomIndex = Math.floor(Math.random() * seatsPool.length);
  const seat = seatsPool[randomIndex];
  seat.isAvailable = false;
  console.log('発券された座席', seat);
  $("#seat").html(seat.id);//発券座席の表示
  $(`#${seat.id}`).addClass('just_issued_color');
  issuedSeats.push(seat);//発券座席を発券済み配列に入れる
  issuedCount = issuedSeats.length;
  remainedCount -= 1;
  $("#issuedCount").html(issuedCount);
  $("#remainedCount").html(remainedCount);
}
//チケット１枚抽選時の関数定義ここまで

//チケット２枚抽選時の関数定義ここから
//ランダムに席を選ぶ関数
function getRandomSeat(seats) {
  const index = Math.floor(Math.random() * seats.length);
  return seats[index];
}
//ランダムに選んだ席の隣席を探して返す関数
function drawPairSeats() {
  const triedSeatIds = new Set();
  const isFan = $("#isFan").prop("checked");
  const availableSeats = objectiveSeats.filter(seat => seat.isAvailable);
  const weightedSeats = [];

  for (const seat of availableSeats) {
    if (isFan && seat.isGoodSeat) {
      weightedSeats.push(seat, seat, seat);
    } else {
      weightedSeats.push(seat);
    }
  }
  console.log('ウェイティッドシート', weightedSeats);
  while (triedSeatIds.size < weightedSeats.length) {
    const availableSeat = getRandomSeat(weightedSeats.filter(seat => !triedSeatIds.has(seat.id)));
    triedSeatIds.add(availableSeat.id);

    const neighborSeat = availableSeats.find(seat =>
      seat.row === availableSeat.row &&
      seat.group === availableSeat.group &&
      (seat.number === availableSeat.number + 1 ||
        seat.number === availableSeat.number - 1
      ));

    if (neighborSeat) {
      return [availableSeat, neighborSeat];
    }
  }
  return "連番で用意できる座席はありません";
}
//選ばれた連番座席を発券済＆表示、スタイル変更の関数化
function issueSeats(seats) {
  for (const seat of seats) {
    seat.isAvailable = false;
    issuedSeats.push(seat);
    issuedCount = issuedSeats.length;
    remainedCount -= 1;
    $(`#${seat.id}`).addClass('just_issued_color');
  }
  const seatIds = seats.map(seat => seat.id).join('・');
  $("#seat").html(seatIds);
  $("#issuedCount").html(issuedCount);
  $("#remainedCount").html(remainedCount);
}

//チケット２枚抽選時の関数定義ここまで

//抽選ボタンをクリックしてから挙動
$("#lottery_btn").on("click", () => {
  for (const issuedSeat of issuedSeats) {
    $(`#${issuedSeat.id}`).removeClass('just_issued_color').addClass('issued_color');
  }//発券済みシートの色をグレーにする
  const ticketCount = parseInt($("#ticketCount").val(), 10);//チケット枚数１、2を整数にする
  if (ticketCount === 1) {
    drawSingleSeat();//チケット1枚の場合の関数
  } else if (ticketCount === 2) {
    const result = drawPairSeats();//チケット２枚の関数
    console.log('抽選された連番', result);
    if (typeof result === 'string') {
      alert(result);//resultが文字==連番がない表示
    } else {
      issueSeats(result);//resultを発券処理関数に渡す
    }
  } else {
    alert('チケット枚数が正しくありません');
  }
});

//抽選結果のクリアボタン
$("#clear").on("click", () => {
  $("#seat").empty();
});


//座席キャンセルの設定
$("#cancel_btn").on("click", () => {
  const cancelId = $("#cancel_input").val().toUpperCase();//入力idを大文字にして取得
  const cancelSeat = issuedSeats.find(seat => seat.id === cancelId);//入力idと同じidを発券済み配列を探索
  if (!cancelSeat) {
    alert('その座席は発券されていません！');
    return;//取得idが発券済みになければエラー
  }
  cancelSeat.isAvailable = true;//属性を抽選可能に変更
  $(`#${cancelSeat.id}`).removeClass('issued_color just_issued_color');//スタイルの削除
  console.log('キャンセルされた座席', cancelSeat);
  issuedSeats = issuedSeats.filter(seat => !seat.isAvailable);//再度、発券済み配列を置き換える
  issuedCount -= 1;
  console.log('キャンセル後の発券済みオブジェクト', issuedSeats);
  remainedCount += 1;
  $("#issuedCount").html(issuedCount);
  $("#remainedCount").html(remainedCount);
});


//ローカルストレージに発券済みを保存
$("#save").on("click", function () {
  const result = confirm('発券データをストレージに保存しますか？');
  if (!result)
    return;
  const issuedSeatIds = issuedSeats.map(seat => seat.id);
  localStorage.setItem("savedIds", JSON.stringify(issuedSeatIds));
  alert('発券済みデータを保存しました');
  console.log('保存済みID数', issuedSeatIds.length);
});

//リセット時、リロード時の発券枚数と残席数のアクションを定義した関数
function updateCounts() {
  issuedCount = issuedSeats.length;
  remainedCount = objectiveSeats.length - issuedSeats.length;
  $("#issuedCount").html(issuedCount);
  $("#remainedCount").html(remainedCount);
}

//ローカルストレージのリセット
$("#reset").on("click", function () {
  const result = confirm('保存データを削除してリセットしますか？');
  if (!result)
    return;
  localStorage.removeItem("savedIds");
  alert('発券済みデータを削除しました');

  for (const seat of issuedSeats) {
    $(`#${seat.id}`).removeClass('issued_color just_issued_color');
  }
  issuedSeats = [];
  console.log(issuedSeats);
  updateCounts();
  $("#seat").empty();
});

//ページ読み込み、保存データの取得
if (localStorage.getItem("savedIds")) {
  const issuedSeatIds = JSON.parse(localStorage.getItem("savedIds"));
  issuedSeats = [];
  for (const id of issuedSeatIds) {
    const seat = objectiveSeats.find(seat => seat.id === id);
    if (seat) {
      seat.isAvailable = false;
      issuedSeats.push(seat);
      $(`#${seat.id}`).addClass('issued_color');
    }
  }
  console.log(issuedSeats);
  updateCounts();
}
