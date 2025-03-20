<script>
  export let careSite;
  export let location;
</script>

<div class="care-site-container">
  <span class="info"><strong>🔢 Care Site ID:</strong> {careSite[0].care_site_id}</span>
  <span class="divider">|</span>
  <span class="info name"><strong>🏥 Name:</strong> {careSite[0].care_site_name}</span>
  <span class="divider">|</span>
  <span class="info"><strong>📍 Address:</strong> {location[0].address_1}, {location[0].address_2} / {location[0].zip}</span>
</div>

<style>
.care-site-container {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  padding: 12px 20px;
  font-size: 1rem;
  background: #fff;
  border-bottom: 2px solid #ccc;
  white-space: nowrap; /* 줄바꿈 방지 */
  overflow-x: auto; /* 넘칠 경우 스크롤 가능 */
}

.info {
  font-weight: normal;
  font-size: 1.1rem;
  margin-right: 15px;
}

.name {
  font-weight: bold;
  font-size: 1.2rem;
}

.divider {
  color: #888;
  font-weight: bold;
  margin: 0 10px;
}
</style>
