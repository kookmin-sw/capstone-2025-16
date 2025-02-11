<script>
	export let title = ''; // 카드의 제목
	export let description = ''; // 카드의 설명
	export let type = 'full'; // 기본값: "full" (가로 전체 사용)

	$: cardWidth = type === 'half' ? '490px' : '1000px';
</script>

<style>
	.card {
		display: flex;
		flex-direction: column;
		border: 1px solid #ccc;
		border-radius: 8px;
		box-shadow: 2px 2px 5px rgba(0, 0, 0, 0.1);
		overflow: hidden;
		width: var(--card-width); /* ✅ 동적으로 변경 */
		height: 400px;
		background-color: white;
		margin: 0 auto;
        min-width: 490px;
	}

	.card-header {
		background-color: lightskyblue;
		color: black;
		font-size: 18px;
		font-weight: bold;
		text-align: center;
		padding: 10px;
	}

	.card-body {
		flex-grow: 1;
		display: flex;
		justify-content: center;
		align-items: center;
		background-color: white;
		padding: 10px;
		overflow: hidden;
	}

	.card-footer {
		background-color: #f2f2f2;
		color: #333;
		font-size: 14px;
		text-align: center;
		padding: 10px;
	}
</style>

<div class="card" style="--card-width: {cardWidth}">
	<!-- 제목 -->
	<div class="card-header">{title}</div>

	<!-- 그래프 영역 -->
	<div class="card-body">
		<slot />
	</div>

	<!-- 설명 -->
    {#if description}
		<div class="card-footer">{description}</div>
	{/if}
</div>
