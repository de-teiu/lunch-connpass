import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { generateDummyData } from '$lib/connpassService';
import type { ConnpassEvent, ConnpassResponse } from '$lib/connpassService';
import { CONNPASS_API_KEY } from '$env/static/private';

// 日付をYYYY-MM-DD形式にフォーマットする関数
function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

// YYYY-MM-DD形式の文字列からYYYYMMDD形式に変換する関数
function convertToYYYYMMDD(dateStr: string): string {
  // YYYY-MM-DD形式からハイフンを削除
  return dateStr.replace(/-/g, '');
}

// 開始日から終了日までの日付リストを生成する関数
function generateDateList(startDate: Date, endDate: Date): string[] {
  const dateList: string[] = [];

  // 開始日から終了日までループ
  const currentDate = new Date(startDate);
  while (currentDate <= endDate) {
    // YYYY-MM-DD形式で取得してYYYYMMDD形式に変換
    const dateStr = formatDate(currentDate);
    dateList.push(convertToYYYYMMDD(dateStr));

    // 次の日に進める
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return dateList;
}

// 日付リストを指定したサイズのチャンクに分割する関数
function chunkDateList(dateList: string[], chunkSize: number): string[][] {
  const chunks: string[][] = [];

  for (let i = 0; i < dateList.length; i += chunkSize) {
    chunks.push(dateList.slice(i, i + chunkSize));
  }

  return chunks;
}

export const GET: RequestHandler = async ({ url }) => {
  // URLパラメータから日付範囲を取得
  const startParam = url.searchParams.get('start');
  const endParam = url.searchParams.get('end');
  console.log('startParam:', startParam, 'endParam:', endParam);
  if (!startParam || !endParam) {
    return json({ error: 'start and end parameters are required' }, { status: 400 });
  }

  // YYYY-MM-DD形式かどうかチェック
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(startParam) || !dateRegex.test(endParam)) {
    return json(
      { error: 'start and end parameters must be in YYYY-MM-DD format' },
      { status: 400 }
    );
  }

  // 日付オブジェクトを作成
  const startDate = new Date(startParam);
  const endDate = new Date(endParam);

  // 日付リストを生成
  const dateList = generateDateList(startDate, endDate);

  // 日付リストを3日ごとに分割
  const chunkedDateLists = chunkDateList(dateList, 3);
  console.log('Chunked date lists:', chunkedDateLists);

  // ダミーデータ生成用に日付オブジェクトを保持
  try {
    // 各チャンクごとにAPIリクエストを送信し、結果を結合
    let allEvents: ConnpassEvent[] = [];

    // APIキーがある場合はヘッダーに追加
    const headers: HeadersInit = {};
    if (CONNPASS_API_KEY) {
      headers['X-API-Key'] = CONNPASS_API_KEY;
    }

    // 各チャンクごとにAPIリクエストを送信
    for (const chunk of chunkedDateLists) {
      const ymdParam = chunk.join(',');
      console.log('Requesting with ymd:', ymdParam);

      // APIパラメータを設定
      const params = new URLSearchParams({
        ymd: ymdParam,
        prefecture: 'online',
        count: '100',
        order: '2'
      });

      // APIリクエスト
      const response = await fetch(`https://connpass.com/api/v2/events/?${params}`, {
        method: 'GET',
        headers
      });

      // レスポンスのステータスコードをチェック
      if (!response.ok) {
        console.error(`API error for chunk ${ymdParam}: ${response.status} ${response.statusText}`);
        continue; // エラーの場合は次のチャンクに進む
      }

      // レスポンスをJSONとしてパース
      const chunkData = (await response.json()) as ConnpassResponse;

      // イベントを結合
      allEvents = [...allEvents, ...chunkData.events];
    }

    // すべてのAPIリクエストが失敗した場合はダミーデータを返す
    if (allEvents.length === 0) {
      console.error('All API requests failed, returning dummy data');
      return json(generateDummyData(startDate, endDate));
    }

    // 結合したデータを作成
    const data: ConnpassResponse = {
      results_start: 1,
      results_returned: allEvents.length,
      results_available: allEvents.length,
      events: allEvents
    };
    // ランチタイムイベントのフィルタリング（12:00より後かつ13:00より前のイベント）
    const lunchTimeEvents = data.events.filter((event: ConnpassEvent) => {
      console.log('----------------------------------------------------------');
      console.log('title:', event.title);
      console.log('started_at:', event.started_at);
      console.log('ended_at:', event.ended_at);
      // started_atとended_atから時刻部分を抽出
      const startedAtTime = event.started_at.split('T')[1]; // "HH:MM:SS"形式
      const endedAtTime = event.ended_at.split('T')[1]; // "HH:MM:SS"形式

      // 時刻を比較するために時間と分を抽出
      const [startHour] = startedAtTime.split(':').map(Number);
      const [endHour, endMinute] = endedAtTime.split(':').map(Number);

      // 12:00より後かつ13:00より前のイベントをフィルタリング
      const isAfter1200 = startHour === 12;
      const isBefore1300 = endHour === 12 || (endHour === 13 && endMinute === 0);
      return isAfter1200 && isBefore1300;
    });

    // フィルタリングした結果をstarted_atの昇順（早い順）にソート
    const sortedEvents = lunchTimeEvents.sort((a, b) => {
      return new Date(a.started_at).getTime() - new Date(b.started_at).getTime();
    });

    // ソートした結果を返す
    const filteredData: ConnpassResponse = {
      ...data,
      results_returned: sortedEvents.length,
      events: sortedEvents
    };
    return json(filteredData);
  } catch (error) {
    // エラーが発生した場合はログに出力し、ダミーデータを返す
    console.error('Error fetching events from connpass API:', error);
    const dummyData = generateDummyData(startDate, endDate);

    // ダミーデータもランチタイムでフィルタリング
    const lunchTimeDummyEvents = dummyData.events.filter((event) => {
      // started_atとended_atから時刻部分を抽出
      const startedAtTime = event.started_at.split(' ')[1]; // "HH:MM:SS"形式
      const endedAtTime = event.ended_at.split(' ')[1]; // "HH:MM:SS"形式

      // 時刻を比較するために時間と分を抽出
      const [startHour, startMinute] = startedAtTime.split(':').map(Number);
      const [endHour, endMinute] = endedAtTime.split(':').map(Number);

      // 12:00より後かつ13:00より前のイベントをフィルタリング
      const isAfter1200 = startHour > 12 || (startHour === 12 && startMinute > 0);
      const isBefore1300 = endHour < 13 || (endHour === 13 && endMinute === 0);

      return isAfter1200 && isBefore1300;
    });

    // ダミーデータもstarted_atの昇順（早い順）にソート
    const sortedDummyEvents = lunchTimeDummyEvents.sort((a, b) => {
      return new Date(a.started_at).getTime() - new Date(b.started_at).getTime();
    });

    const filteredDummyData: ConnpassResponse = {
      ...dummyData,
      results_returned: sortedDummyEvents.length,
      events: sortedDummyEvents
    };

    return json(filteredDummyData);
  }
};
