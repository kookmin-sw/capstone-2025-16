<script>
  export let bioSignal;

  // 이미지 파일 여부 확인 함수
  function isImage(filePath) {
    return /\.(jpg|jpeg|png|gif|bmp|svg)$/i.test(filePath);
  }
</script>

<div class="bio-signal-container">
  <h2 class="title">📡 Bio Signal Information</h2>

  {#each bioSignal as signal}
    <div class="bio-signal-row">
      <span class="info"><strong>📌 Bio Signal ID:</strong> {signal["bio_signal)id"]}</span>
      <span class="divider">|</span>
      <span class="info"><strong>📅 Date:</strong> {signal.bio_signal_date}</span>
      <span class="divider">|</span>
      <span class="info"><strong>🔍 Concept ID:</strong> 
        <span class="highlight">{signal.bio_signal_concept_id}</span>
      </span>
      <span class="divider">|</span>
      <span class="info"><strong>📝 Source Value:</strong> {signal.bio_signal_source_value}</span>
    </div>
    <div class="mt-[16px]">
      {#if isImage(signal.file_path)}
        <img class="image-preview" src={signal.file_path} alt="Bio Signal" />
      {:else}
        <span class="highlight-blue">{signal.file_path}</span>
      {/if}
    </div>
  {/each}
</div>

<style>
  .bio-signal-container {
    padding: 16px;
    background: #f9f9f9;
    border-radius: 8px;
    border: 1px solid #ddd;
    max-width: 100%;
  }

  .title {
    font-size: 1.5rem;
    font-weight: bold;
    margin-bottom: 10px;
  }

  .bio-signal-row {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    padding: 8px 0;
    font-size: 1rem;
    background: #fff;
    border-bottom: 1px solid #ddd;
    white-space: nowrap;
  }

  .info {
    font-weight: normal;
    font-size: 1.1rem;
    margin-right: 10px;
  }

  .divider {
    color: #888;
    font-weight: bold;
    margin: 0 10px;
  }

  /* 강조 표시 (Concept ID) */
  .highlight {
    color: #16a34a; /* Tailwind text-green-600 */
    font-weight: bold;
  }

  /* 강조 표시 (File Path) */
  .highlight-blue {
    color: #2563eb; /* Tailwind text-blue-600 */
    font-weight: bold;
  }

  /* 이미지 미리보기 스타일 */
  .image-preview {
    max-width: 100px;
    max-height: 100px;
    border-radius: 4px;
    margin-left: 10px;
    border: 1px solid #ddd;
  }
</style>
