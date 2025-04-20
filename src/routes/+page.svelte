<script lang="ts">
  import { onMount } from 'svelte';
  import { fetchLunchEvents, type ConnpassEvent } from '$lib/connpassService';

  let startDate: string;
  let endDate: string;
  let events: ConnpassEvent[] = [];
  let isLoading = false;
  let error: string | null = null;

  // 今日の日付を取得
  const today = new Date();

  // 3ヶ月後の日付を取得
  const threeMonthsLater = new Date();
  threeMonthsLater.setMonth(today.getMonth() + 1);

  // 日付をYYYY-MM-DD形式にフォーマット
  const formatDateForInput = (date: Date): string => {
    return date.toISOString().split('T')[0];
  };

  // デフォルト値を設定
  startDate = formatDateForInput(today);
  endDate = formatDateForInput(threeMonthsLater);

  // イベントを検索する関数
  async function searchEvents() {
    isLoading = true;
    error = null;

    try {
      const start = new Date(startDate);
      const end = new Date(endDate);

      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        throw new Error('有効な日付を入力してください');
      }

      if (start > end) {
        throw new Error('開始日は終了日より前である必要があります');
      }

      const response = await fetchLunchEvents(start, end);
      events = response.events;

      if (events.length === 0) {
        error = '指定された期間内にイベントが見つかりませんでした';
      }
    } catch (err) {
      error = err instanceof Error ? err.message : '検索中にエラーが発生しました';
      events = [];
    } finally {
      isLoading = false;
    }
  }

  // コンポーネントがマウントされたときに初期検索を実行
  onMount(() => {
    searchEvents();
  });

  // 日付をフォーマットする関数
  function formatDate(dateString: string): string {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long',
      hour: 'numeric',
      minute: 'numeric'
    }).format(date);
  }
</script>

<div class="container mx-auto px-4 py-8">
  <div class="mb-8 rounded-lg bg-white p-6 shadow-md">
    <h2 class="mb-4 text-xl font-semibold">検索条件</h2>

    <form
      on:submit|preventDefault={searchEvents}
      class="space-y-4 md:flex md:items-end md:space-y-0 md:space-x-4"
    >
      <div class="flex-1">
        <label for="startDate" class="mb-1 block text-sm font-medium text-gray-700">開始日</label>
        <input
          type="date"
          id="startDate"
          bind:value={startDate}
          class="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-4 py-2"
        />
      </div>

      <div class="flex-1">
        <label for="endDate" class="mb-1 block text-sm font-medium text-gray-700">終了日</label>
        <input
          type="date"
          id="endDate"
          bind:value={endDate}
          class="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-4 py-2"
        />
      </div>

      <div>
        <button
          type="submit"
          class="w-full rounded-md bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none md:w-auto"
          disabled={isLoading}
        >
          {isLoading ? '検索中...' : '検索'}
        </button>
      </div>
    </form>
  </div>

  {#if isLoading}
    <div class="my-12 flex justify-center">
      <div class="h-12 w-12 animate-spin rounded-full border-t-2 border-b-2 border-blue-500"></div>
    </div>
  {:else if error}
    <div class="mb-8 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-red-700">
      {error}
    </div>
  {:else if events.length > 0}
    <h2 class="mb-4 text-2xl font-semibold">検索結果: {events.length}件</h2>

    <div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      {#each events as event}
        <div
          class="overflow-hidden rounded-lg bg-white shadow-md transition-shadow duration-300 hover:shadow-lg"
        >
          <div class="p-6">
            <h3 class="mb-2 line-clamp-2 text-lg font-semibold">{event.title}</h3>
            <p class="mb-4 line-clamp-3 text-gray-600">{event.catch}</p>

            <div class="mb-4 space-y-2">
              <div class="flex items-start">
                <svg
                  class="mt-0.5 mr-2 h-5 w-5 text-gray-500"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fill-rule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                    clip-rule="evenodd"
                  />
                </svg>
                <span class="text-gray-700">
                  {new Date(event.started_at).toLocaleDateString('ja-JP', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    weekday: 'long'
                  })}
                  {event.started_at.substring(11, 16)}～{event.ended_at.substring(11, 16)}
                </span>
              </div>

              <div class="flex items-start">
                <svg
                  class="mt-0.5 mr-2 h-5 w-5 text-gray-500"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fill-rule="evenodd"
                    d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                    clip-rule="evenodd"
                  />
                </svg>
                <span class="text-gray-700">{event.place}</span>
              </div>

              <div class="flex items-start">
                <svg
                  class="mt-0.5 mr-2 h-5 w-5 text-gray-500"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z"
                  />
                </svg>
                <span class="text-gray-700">
                  定員: {event.limit ? `${event.limit}人` : 'なし'}（参加: {event.accepted}人、補欠: {event.waiting}人）
                </span>
              </div>
            </div>

            <a
              href={event.url}
              target="_blank"
              rel="noopener noreferrer"
              class="block w-full rounded-md bg-blue-600 px-4 py-2 text-center font-medium text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none">
              詳細を見る
            </a>
          </div>
        </div>
      {/each}
    </div>
  {:else}
    <div class="mb-8 rounded-md border border-yellow-200 bg-yellow-50 px-4 py-3 text-yellow-700">
      検索結果がありません。日付範囲を変更して再度検索してください。
    </div>
  {/if}
</div>
