package com.example.kiosk.kioskOrder;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestTemplate;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
public class AiProxyController {

    private final RestTemplate restTemplate;

    @Value("${gcp.api.key:}")
    private String gcpApiKey;

    private static final String GEMINI_URL =
            "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

    private boolean hasGemini() {
        return gcpApiKey != null && !gcpApiKey.isBlank();
    }

    // ── AI 매출 분석 ──

    @SuppressWarnings("unchecked")
    @PostMapping("/sales-analysis")
    public ResponseEntity<?> salesAnalysis(@RequestBody Map<String, Object> body) {
        try {
            List<Map<String, Object>> salesList =
                    (List<Map<String, Object>>) body.getOrDefault("salesList", List.of());
            List<Map<String, Object>> dailyStats =
                    (List<Map<String, Object>>) body.getOrDefault("dailyStats", List.of());
            List<Map<String, Object>> hourlyStats =
                    (List<Map<String, Object>>) body.getOrDefault("hourlyStats", List.of());

            String analysis;
            if (hasGemini()) {
                String prompt = buildAnalysisPrompt(salesList, dailyStats, hourlyStats);
                analysis = callGemini(prompt);
            } else {
                analysis = buildFallbackAnalysis(salesList, dailyStats, hourlyStats);
            }

            return ResponseEntity.ok(Map.of("analysis", analysis));
        } catch (Exception e) {
            return ResponseEntity.status(502).body(Map.of(
                    "error", "AI 분석 중 오류가 발생했습니다.",
                    "detail", e.getMessage()
            ));
        }
    }

    // ── 매출 예측 ──

    @SuppressWarnings("unchecked")
    @PostMapping("/sales-forecast")
    public ResponseEntity<?> salesForecast(@RequestBody Map<String, Object> body) {
        try {
            List<Map<String, Object>> monthlyData =
                    (List<Map<String, Object>>) body.getOrDefault("monthlyData", List.of());

            List<Map<String, Object>> forecastData = computeForecast(monthlyData);
            double growthRate = computeGrowthRate(monthlyData);

            String insight;
            if (hasGemini()) {
                insight = callGemini(buildForecastInsightPrompt(monthlyData, growthRate));
            } else {
                insight = buildFallbackForecastInsight(monthlyData, growthRate);
            }

            return ResponseEntity.ok(Map.of(
                    "forecastData", forecastData,
                    "growthRate", Math.round(growthRate * 10.0) / 10.0,
                    "insight", insight
            ));
        } catch (Exception e) {
            return ResponseEntity.status(502).body(Map.of(
                    "error", "예측 중 오류가 발생했습니다.",
                    "detail", e.getMessage()
            ));
        }
    }

    // ── Gemini API 호출 ──

    private String callGemini(String prompt) {
        String url = GEMINI_URL + "?key=" + gcpApiKey;

        Map<String, Object> part = Map.of("text", prompt);
        Map<String, Object> content = Map.of("parts", List.of(part));
        Map<String, Object> requestBody = Map.of("contents", List.of(content));

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestBody, headers);

        @SuppressWarnings("unchecked")
        Map<String, Object> response = restTemplate.postForObject(url, request, Map.class);

        if (response == null || !response.containsKey("candidates")) {
            throw new RuntimeException("Gemini API 응답이 비어 있습니다.");
        }

        List<Map<String, Object>> candidates = (List<Map<String, Object>>) response.get("candidates");
        if (candidates.isEmpty()) {
            throw new RuntimeException("Gemini API가 결과를 반환하지 않았습니다.");
        }

        Map<String, Object> first = candidates.get(0);
        Map<String, Object> respContent = (Map<String, Object>) first.get("content");
        List<Map<String, Object>> parts = (List<Map<String, Object>>) respContent.get("parts");
        return (String) parts.get(0).get("text");
    }

    // ── 폴백: Gemini 없이 기본 통계 분석 ──

    private String buildFallbackAnalysis(
            List<Map<String, Object>> salesList,
            List<Map<String, Object>> dailyStats,
            List<Map<String, Object>> hourlyStats) {

        StringBuilder sb = new StringBuilder();
        sb.append("**📊 기본 매출 분석 (Gemini API 키 미설정)**\n\n");
        sb.append("> 💡 GCP API 키를 설정하면 Gemini AI의 상세 분석을 받을 수 있습니다.\n");
        sb.append("> `application.properties` 또는 환경변수 `GCP_API_KEY`를 설정하세요.\n\n");

        // ── 1. 베스트셀러 ──
        if (!salesList.isEmpty()) {
            sb.append("### 1. 매출 트렌드 요약\n\n");

            // 판매량 top 5
            List<Map<String, Object>> byCount = new ArrayList<>(salesList);
            byCount.sort((a, b) -> {
                int ca = ((Number) a.getOrDefault("count", 0)).intValue();
                int cb = ((Number) b.getOrDefault("count", 0)).intValue();
                return Integer.compare(cb, ca);
            });
            sb.append("**🏆 판매량 TOP 5**\n");
            for (int i = 0; i < Math.min(5, byCount.size()); i++) {
                Map<String, Object> item = byCount.get(i);
                String name = String.valueOf(item.getOrDefault("menuName", "?"));
                int count = ((Number) item.getOrDefault("count", 0)).intValue();
                double price = ((Number) item.getOrDefault("price", 0)).doubleValue();
                sb.append(String.format("- %d위 **%s**: %d개 (매출 %,d원)\n",
                        i + 1, name, count, (int) (price * count)));
            }

            // 카테고리별 집계
            Map<String, Integer> catCount = new HashMap<>();
            Map<String, Integer> catRevenue = new HashMap<>();
            for (Map<String, Object> item : salesList) {
                String cat = String.valueOf(item.getOrDefault("category", "?"));
                int count = ((Number) item.getOrDefault("count", 0)).intValue();
                double price = ((Number) item.getOrDefault("price", 0)).doubleValue();
                catCount.merge(cat, count, Integer::sum);
                catRevenue.merge(cat, (int) (price * count), Integer::sum);
            }
            sb.append("\n**📦 카테고리별 매출**\n");
            catRevenue.entrySet().stream()
                    .sorted((a, b) -> Integer.compare(b.getValue(), a.getValue()))
                    .forEach(e -> sb.append(String.format("- **%s**: %,d원 (%d개)\n",
                            e.getKey(), e.getValue(), catCount.getOrDefault(e.getKey(), 0))));
        }

        // ── 2. 요일/시간 패턴 ──
        sb.append("\n### 2. 요일 및 시간대 패턴\n\n");

        if (!dailyStats.isEmpty()) {
            sb.append("**📅 요일별 매출**\n");
            dailyStats.stream()
                    .sorted((a, b) -> {
                        double ra = ((Number) a.getOrDefault("revenue", 0)).doubleValue();
                        double rb = ((Number) b.getOrDefault("revenue", 0)).doubleValue();
                        return Double.compare(rb, ra);
                    })
                    .forEach(item -> {
                        String day = String.valueOf(item.getOrDefault("day", "?"));
                        int count = ((Number) item.getOrDefault("orderCount", 0)).intValue();
                        double rev = ((Number) item.getOrDefault("revenue", 0)).doubleValue();
                        sb.append(String.format("- **%s**: 주문 %d건, 매출 %,d원\n", day, count, (int) rev));
                    });
        }

        if (!hourlyStats.isEmpty()) {
            sb.append("\n**⏰ 시간대별 매출**\n");
            hourlyStats.stream()
                    .sorted((a, b) -> {
                        double ra = ((Number) a.getOrDefault("revenue", 0)).doubleValue();
                        double rb = ((Number) b.getOrDefault("revenue", 0)).doubleValue();
                        return Double.compare(rb, ra);
                    })
                    .limit(8)
                    .forEach(item -> {
                        String hour = String.valueOf(item.getOrDefault("hour", "?"));
                        int count = ((Number) item.getOrDefault("orderCount", 0)).intValue();
                        double rev = ((Number) item.getOrDefault("revenue", 0)).doubleValue();
                        sb.append(String.format("- **%s**: 주문 %d건, 매출 %,d원\n", hour, count, (int) rev));
                    });
        }

        // ── 3. 제안 ──
        sb.append("\n### 3. 개선 제안\n\n");
        sb.append("- 베스트셀러 메뉴의 재고를 충분히 확보하고, 인기 없는 메뉴는 프로모션을 검토하세요.\n");
        sb.append("- 매출이 집중되는 요일/시간대에 맞춰 직원 스케줄을 조정하세요.\n");

        return sb.toString();
    }

    private String buildFallbackForecastInsight(
            List<Map<String, Object>> monthlyData, double growthRate) {

        if (monthlyData.isEmpty()) {
            return "예측할 데이터가 충분하지 않습니다. 매출 데이터가 쌓이면 더 정확한 예측이 가능합니다.";
        }

        String trend;
        if (growthRate > 5) trend = "강한 성장세";
        else if (growthRate > 0) trend = "완만한 성장세";
        else if (growthRate > -5) trend = "소폭 감소세";
        else trend = "감소세";

        double lastRevenue = ((Number) monthlyData.get(monthlyData.size() - 1)
                .getOrDefault("revenue", 0)).doubleValue();

        return String.format(
                "최근 매출은 월평균 **%.1f%%**의 %s를 보이고 있습니다. "
                        + "직전 월 매출은 **%,d원**입니다. "
                        + "현재 추세를 유지하기 위해 기존 인기 메뉴의 품질을 유지하고, "
                        + "비수기 시간대에 할인 프로모션을 도입하는 것을 검토해보세요.",
                growthRate, trend, (int) lastRevenue);
    }

    // ── 프롬프트 생성 ──

    private String buildAnalysisPrompt(
            List<Map<String, Object>> salesList,
            List<Map<String, Object>> dailyStats,
            List<Map<String, Object>> hourlyStats) {

        StringBuilder sb = new StringBuilder();

        sb.append("You are an expert cafe business consultant analyzing real sales data.\n");
        sb.append("Based on the following data, provide sharp and actionable insights for the cafe owner.\n\n");

        sb.append("[Menu Sales Data]\n");
        for (Map<String, Object> item : salesList) {
            String name = String.valueOf(item.getOrDefault("menuName", "?"));
            String cat = String.valueOf(item.getOrDefault("category", "?"));
            int count = ((Number) item.getOrDefault("count", 0)).intValue();
            double price = ((Number) item.getOrDefault("price", 0)).doubleValue();
            sb.append(String.format("- %s (%s): %d개 판매, 매출 %,d원\n",
                    name, cat, count, (int) (price * count)));
        }

        sb.append("\n[Sales by Day of Week]\n");
        for (Map<String, Object> item : dailyStats) {
            String day = String.valueOf(item.getOrDefault("day", "?"));
            int count = ((Number) item.getOrDefault("orderCount", 0)).intValue();
            double rev = ((Number) item.getOrDefault("revenue", 0)).doubleValue();
            sb.append(String.format("- %s: 주문 %d건, 매출 %,d원\n", day, count, (int) rev));
        }

        sb.append("\n[Sales by Hour]\n");
        for (Map<String, Object> item : hourlyStats) {
            String hour = String.valueOf(item.getOrDefault("hour", "?"));
            int count = ((Number) item.getOrDefault("orderCount", 0)).intValue();
            double rev = ((Number) item.getOrDefault("revenue", 0)).doubleValue();
            sb.append(String.format("- %s: 주문 %d건, 매출 %,d원\n", hour, count, (int) rev));
        }

        sb.append("\nAnalyze the data and write in Korean with the following structure:\n");
        sb.append("1. Sales trend summary (best-selling menus, category trends with specific numbers)\n");
        sb.append("2. Day of week and hourly pattern analysis (when is it busiest and slowest, use exact figures)\n");
        sb.append("3. Two immediately actionable improvement suggestions (data-driven and specific, not generic)\n\n");
        sb.append("Rules:\n");
        sb.append("- Write the entire response in Korean\n");
        sb.append("- Always reference specific numbers from the data\n");
        sb.append("- Avoid vague or generic business advice\n");
        sb.append("- Use a friendly but professional tone suitable for a small cafe owner");

        return sb.toString();
    }

    private String buildForecastInsightPrompt(List<Map<String, Object>> monthlyData, double growthRate) {
        StringBuilder sb = new StringBuilder();
        sb.append("You are an expert cafe sales analyst.\n");
        sb.append("Analyze the following time-series forecast results and provide insights for the store owner.\n\n");

        sb.append("Recent monthly revenue:\n");
        for (Map<String, Object> item : monthlyData) {
            double rev = ((Number) item.getOrDefault("revenue", 0)).doubleValue();
            String month = String.valueOf(item.getOrDefault("month", "?"));
            sb.append(String.format("- %s: %,d원\n", month, (int) rev));
        }

        sb.append(String.format("\nExpected growth rate: %.1f%%\n\n", growthRate));

        sb.append("Write 2-3 sentences in Korean following this format:\n");
        sb.append("1. A specific evaluation of the recent trend (mention specific numbers or patterns)\n");
        sb.append("2. A practical comment on next month's forecast\n");
        sb.append("3. One actionable suggestion the owner can implement immediately\n\n");
        sb.append("Rules:\n");
        sb.append("- Write the entire response in Korean\n");
        sb.append("- Always reference specific numbers from the data\n");
        sb.append("- Avoid vague or generic business advice\n");
        sb.append("- Use a friendly but professional tone suitable for a small cafe owner");

        return sb.toString();
    }

    // ── 예측 계산 (선형 회귀) ──

    private List<Map<String, Object>> computeForecast(List<Map<String, Object>> monthlyData) {
        List<Map<String, Object>> result = new ArrayList<>();

        if (monthlyData.isEmpty()) {
            return result;
        }

        // 실제 데이터 포인트
        for (Map<String, Object> item : monthlyData) {
            String month = String.valueOf(item.getOrDefault("month", "?"));
            double revenue = ((Number) item.getOrDefault("revenue", 0)).doubleValue();
            Map<String, Object> point = new HashMap<>();
            point.put("month", month);
            point.put("value", Math.round(revenue));
            point.put("isPredicted", false);
            result.add(point);
        }

        int n = monthlyData.size();
        String lastMonth = String.valueOf(monthlyData.get(n - 1).getOrDefault("month", "?"));
        double lastRevenue = ((Number) monthlyData.get(n - 1).getOrDefault("revenue", 0)).doubleValue();

        if (n < 2) {
            // 데이터 1개월 → 동일 매출로 3개월 예측
            for (int i = 1; i <= 3; i++) {
                Map<String, Object> point = new HashMap<>();
                point.put("month", incrementMonth(lastMonth, i));
                point.put("value", Math.round(lastRevenue));
                point.put("isPredicted", true);
                result.add(point);
            }
            return result;
        }

        // 선형 회귀
        double sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
        for (int i = 0; i < n; i++) {
            double revenue = ((Number) monthlyData.get(i).getOrDefault("revenue", 0)).doubleValue();
            sumX += i;
            sumY += revenue;
            sumXY += i * revenue;
            sumX2 += i * i;
        }
        double slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);

        for (int i = 1; i <= 3; i++) {
            double predicted = lastRevenue + slope * i;
            if (predicted < 0) predicted = lastRevenue;
            Map<String, Object> point = new HashMap<>();
            point.put("month", incrementMonth(lastMonth, i));
            point.put("value", Math.round(predicted));
            point.put("isPredicted", true);
            result.add(point);
        }

        return result;
    }

    private double computeGrowthRate(List<Map<String, Object>> monthlyData) {
        if (monthlyData.size() < 2) return 0.0;

        double first = ((Number) monthlyData.get(0).getOrDefault("revenue", 0)).doubleValue();
        double last = ((Number) monthlyData.get(monthlyData.size() - 1).getOrDefault("revenue", 0)).doubleValue();

        if (first == 0) return 0.0;
        double totalGrowth = (last - first) / first * 100.0;
        int months = monthlyData.size() - 1;
        return totalGrowth / months;
    }

    private String incrementMonth(String month, int offset) {
        try {
            String[] parts = month.split("-");
            int year = Integer.parseInt(parts[0]);
            int mon = Integer.parseInt(parts[1]);
            mon += offset;
            while (mon > 12) { mon -= 12; year++; }
            return String.format("%d-%02d", year, mon);
        } catch (Exception e) {
            return month;
        }
    }
}
