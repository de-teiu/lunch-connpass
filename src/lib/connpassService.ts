export interface ConnpassEvent {
  id: number;
  title: string;
  catch: string;
  description: string;
  url: string;
  image_url: string;
  hash_tag: string;
  started_at: string;
  ended_at: string;
  limit: number;
  event_type: string;
  open_status: string;
  group: Object;
  address: string;
  place: string;
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

// エラーレスポンスの型定義
export interface ConnpassErrorResponse {
  error: string;
}

// APIレスポンスの型（正常レスポンスまたはエラーレスポンス）
export type ApiResponse = ConnpassResponse | ConnpassErrorResponse;

// 日付をYYYY-MM-DD形式にフォーマットする関数
function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

// サーバーサイドAPIからイベントを取得する関数
export async function fetchLunchEvents(startDate: Date, endDate: Date): Promise<ApiResponse> {
  try {
    // サーバーサイドAPIのURLパラメータを設定
    const params = new URLSearchParams({
      start: formatDate(startDate),
      end: formatDate(endDate)
    });

    // サーバーサイドAPIリクエスト
    const response = await fetch(`/api/events?${params}`, {
      method: 'GET'
    });

    // 504エラー（タイムアウト）をチェック
    if (response.status === 504) {
      return {
        error: 'タイムアウトが発生しました。再検索してください'
      } as ConnpassErrorResponse;
    }

    // レスポンスをJSONとしてパース
    const data = await response.json();

    // エラーレスポンスかどうかをチェック
    if ('error' in data) {
      return data as ConnpassErrorResponse;
    }

    return data as ConnpassResponse;
  } catch (error) {
    console.log(error);
    return {
      error: '予期せぬエラーが発生しました。'
    } as ConnpassErrorResponse;
  }
}
