export interface ConnpassEvent {
  event_id: number;
  title: string;
  catch: string;
  description: string;
  event_url: string;
  started_at: string;
  ended_at: string;
  limit: number;
  hash_tag: string;
  place: string;
  address: string;
  lat: string;
  lon: string;
  owner_id: number;
  owner_nickname: string;
  owner_display_name: string;
  accepted: number;
  waiting: number;
  updated_at: string;
}

export interface ConnpassResponse {
  results_start: number;
  results_returned: number;
  results_available: number;
  events: ConnpassEvent[];
}

// ダミーデータを生成する関数
export function generateDummyData(startDate: Date, endDate: Date): ConnpassResponse {
  const events: ConnpassEvent[] = [];
  
  // 開始日から終了日までの各日付について
  const currentDate = new Date(startDate);
  while (currentDate <= endDate) {
    // 平日（月〜金）のみイベントを生成
    const dayOfWeek = currentDate.getDay();
    if (dayOfWeek >= 1 && dayOfWeek <= 5) {
      // ランチタイム（12:00-13:00）のイベント
      const eventDate = new Date(currentDate);
      // 12:00-13:00のイベントを設定
      const startTime = new Date(currentDate);
      startTime.setHours(12, 0, 0);
      
      const endTime = new Date(currentDate);
      endTime.setHours(13, 0, 0);
      
      events.push({
        event_id: Math.floor(Math.random() * 100000),
        title: `ランチタイム勉強会: ${formatDate(currentDate)}`,
        catch: `平日のランチタイムに気軽に参加できる勉強会です`,
        description: `
          # ランチタイム勉強会
          
          平日のランチタイムに気軽に参加できる勉強会です。
          お弁当を食べながら、最新の技術トレンドについて話し合いましょう。
          
          ## 対象者
          - エンジニア
          - デザイナー
          - プロダクトマネージャー
          
          ## 持ち物
          - お弁当（各自でご用意ください）
          - PC（必要に応じて）
        `,
        event_url: `https://connpass.com/event/dummy-${formatDate(currentDate)}/`,
        started_at: formatDateTime(startTime),
        ended_at: formatDateTime(endTime),
        limit: 30,
        hash_tag: "ランチタイム勉強会",
        place: "オンライン",
        address: "",
        lat: "",
        lon: "",
        owner_id: 12345,
        owner_nickname: "lunch_organizer",
        owner_display_name: "ランチ勉強会運営",
        accepted: Math.floor(Math.random() * 30),
        waiting: Math.floor(Math.random() * 10),
        updated_at: formatDateTime(new Date())
      });
    }
    
    // 次の日に進める
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return {
    results_start: 1,
    results_returned: events.length,
    results_available: events.length,
    events: events
  };
}

// 日付をYYYY-MM-DD形式にフォーマットする関数
function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

// 日時をYYYY-MM-DD HH:MM:SS形式にフォーマットする関数（日本時間）
function formatDateTime(date: Date): string {
  // 日本時間（UTC+9）でフォーマット
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

// APIからイベントを取得する関数（実際にはダミーデータを返す）
export async function fetchLunchEvents(startDate: Date, endDate: Date): Promise<ConnpassResponse> {
  // 実際のAPIを使用する場合は以下のようなコードになります
  // const params = new URLSearchParams({
  //   start: formatDate(startDate),
  //   end: formatDate(endDate),
  //   order: '2', // 開催日順
  //   count: '100'
  // });
  // const response = await fetch(`https://connpass.com/api/v2/event/?${params}`);
  // return await response.json();
  
  // ダミーデータを返す
  return generateDummyData(startDate, endDate);
}
