import asyncio
import nats
import json
import os
from dotenv import load_dotenv

load_dotenv()


async def publish_message(message):
    """
    NATS JetStream을 통해 영속성 메시지를 발행하는 함수
    """
    try:
        # NATS 서버 연결 (인증 정보 추가)
        nc = await nats.connect(os.getenv("NATS_URL"))
        stream_name = os.getenv("NATS_STREAM_NAME")
        subject = os.getenv("NATS_SUBJECT")

        # JetStream 컨텍스트 생성
        js = nc.jetstream()

        # 스트림 생성 (이미 존재하면 가져옴)
        try:
            # 기존 스트림 정보 가져오기 시도
            await js.stream_info(stream_name)
            print(f"기존 '{stream_name}' 스트림을 사용합니다.")
        except nats.js.errors.NotFoundError:
            # 스트림이 없으면 새로 생성
            await js.add_stream(name=stream_name, subjects=[subject])
            print(f"'{stream_name}' 스트림을 생성했습니다.")

        # JetStream을 통해 메시지 발행
        ack = await js.publish(subject, message.encode())
        print(f"[발행] 주제: {subject}, 메시지: '{message}'")
        print(f"메시지 확인: 스트림={ack.stream}, 시퀀스={ack.seq}")

        # 연결 종료
        await nc.close()
        return True
    except Exception as e:
        print(f"메시지 발행 중 오류 발생: {e}")
        return False


async def main():
    # 테스트용 메시지
    message = json.dumps({
        "cohort_id": "0196815f-1e2d-7db9-b630-a747f8393a2d",
        "k": 30
    })

    await publish_message(message)

if __name__ == "__main__":
    asyncio.run(main())
