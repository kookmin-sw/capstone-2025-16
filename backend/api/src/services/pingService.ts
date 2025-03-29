export const getPingMessage = () => {
    return {
        message: 'pong',
        timestamp: new Date().toISOString()
    };
} 