<script>
    export let message = 'Loading...';
</script>
  
<style>
    .loading-container {
      display: flex;
      justify-content: center;
      align-items: center;
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(255, 255, 255, 0.8);
      z-index: 9999;
      font-size: 24px;
      font-weight: bold;
      color: #007acc;
    }
  
    .spinner {
      border: 4px solid rgba(0, 122, 204, 0.2);
      border-top: 4px solid #007acc;
      border-radius: 50%;
      width: 50px;
      height: 50px;
      animation: spin 1s linear infinite;
    }
  
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
</style>
  
<div class="loading-container">
    <div class="spinner mr-5"></div>
    <p>{message}</p>
</div>