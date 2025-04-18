import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { generateDummyData } from '$lib/connpassService';
import type { ConnpassResponse } from '$lib/connpassService';

// 日付をYYYY-MM-DD形式にフォーマットする関数
function formatDate(date: Date): string {
	return date.toISOString().split('T')[0];
}

// YYYY-MM-DD形式の文字列からYYYYMM形式を抽出する関数
function extractYYYYMMFromDate(dateStr: string): string {
	// YYYY-MM-DD形式から年と月を抽出
	const parts = dateStr.split('-');
	if (parts.length >= 2) {
		const year = parts[0];
		const month = parts[1];
		return `${year}${month}`;
	}
	return '';
}

// YYYYMM形式の文字列から年と月を抽出する関数
function extractYearMonth(yyyymm: string): { year: number; month: number } {
	const year = parseInt(yyyymm.substring(0, 4), 10);
	const month = parseInt(yyyymm.substring(4, 6), 10);
	return { year, month };
}

// 開始年月から終了年月までの年月リストを生成する関数
function generateYearMonthList(startYYYYMM: string, endYYYYMM: string): string[] {
	const start = extractYearMonth(startYYYYMM);
	const end = extractYearMonth(endYYYYMM);

	const yearMonthList: string[] = [];

	let currentYear = start.year;
	let currentMonth = start.month;

	while (currentYear < end.year || (currentYear === end.year && currentMonth <= end.month)) {
		// YYYYMM形式で追加
		yearMonthList.push(`${currentYear}${currentMonth.toString().padStart(2, '0')}`);

		// 次の月に進める
		currentMonth++;
		if (currentMonth > 12) {
			currentMonth = 1;
			currentYear++;
		}
	}

	return yearMonthList;
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

	// YYYY-MM-DD形式からYYYYMM形式を抽出
	const startYYYYMM = extractYYYYMMFromDate(startParam);
	const endYYYYMM = extractYYYYMMFromDate(endParam);

	// 年月リストを生成してカンマ区切りで連結
	const yearMonthList = generateYearMonthList(startYYYYMM, endYYYYMM);
	const ymParam = yearMonthList.join(',');

	// 日付オブジェクトも作成（ダミーデータ生成用）
	const startDate = new Date(startParam);
	const endDate = new Date(endParam);

	try {
		// APIパラメータを設定
		const params = new URLSearchParams({
			ym: ymParam,
			count: '100'
		});

		// APIキーがある場合はヘッダーに追加
		const headers: HeadersInit = {};
		if (import.meta.env.CONNPASS_API_KEY) {
			headers['X-API-Key'] = import.meta.env.CONNPASS_API_KEY;
		}

		// APIリクエスト
		console.log(params.toString());
		const response = await fetch(`https://connpass.com/api/v2/events/?${params}`, {
			method: 'GET',
			headers
		});

		// レスポンスのステータスコードをチェック
		if (!response.ok) {
			console.error(`API error: ${response.status} ${response.statusText}`);
			// APIエラーの場合はダミーデータを返す
			return json(generateDummyData(startDate, endDate));
		}

		// レスポンスをJSONとしてパース
		const data = (await response.json()) as ConnpassResponse;
		return json(data);
	} catch (error) {
		// エラーが発生した場合はログに出力し、ダミーデータを返す
		console.error('Error fetching events from connpass API:', error);
		return json(generateDummyData(startDate, endDate));
	}
};
