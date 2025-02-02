<script>
  import { page } from '$app/state';

</script>

<div class="flex h-full w-full flex-col items-center justify-center">
  {#if page.status === 404}
    <h1 class="text-3xl font-bold text-zinc-900">페이지를 찾을 수 없습니다</h1>
    <p class="text-zinc-700 mt-4">요청하신 페이지가 존재하지 않습니다.</p>
  {:else}
    <h1 class="text-3xl font-bold text-zinc-900">서버 오류가 발생했습니다</h1>
    <p class="text-zinc-700 mt-4">죄송합니다. 서버에 문제가 발생했습니다. 잠시 후 다시 시도해주세요.</p>
    {#if page.error?.message}
      <p class="error-message">{page.error.message}</p>
    {/if}
  {/if}
  <a href="/" class="text-blue-700 mt-8">메인 페이지로 돌아가기</a>
</div>
