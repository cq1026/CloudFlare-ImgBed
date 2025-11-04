export async function onRequest(context) {
    // 获取请求体中URL的内容，判断是否为图片或视频，如果是则返回，否则返回错误信息
    const {
        request,
        env,
        params,
        waitUntil,
        next,
        data
    } = context;
    //如果是OPTIONS请求，返回允许的方法
    if (request.method === 'OPTIONS') {
        return new Response(null, {
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type'
            }
        })
    }
    const jsonRequest = await request.json();
    const url = jsonRequest.url;
    if (url === undefined) {
        return new Response('URL is required', { status: 400 })
    }
    const response = await fetch(url);
    const contentType = response.headers.get('content-type');

    // Check content-type if it exists
    const hasValidContentType = contentType && (contentType.startsWith('image') || contentType.startsWith('video'));

    // Fallback: check URL file extension for cases where content-type is missing or incorrect
    const urlPath = new URL(url).pathname.toLowerCase();
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg', '.ico', '.tiff', '.avif', '.heic', '.heif'];
    const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov', '.avi', '.mkv', '.flv', '.wmv', '.m4v', '.3gp'];
    const hasValidExtension = [...imageExtensions, ...videoExtensions].some(ext => urlPath.endsWith(ext));

    if (hasValidContentType || hasValidExtension) {
        //增加跨域头后返回
        const headers = new Headers(response.headers);
        headers.set('Access-Control-Allow-Origin', '*');
        return new Response(response.body, {
            headers: headers
        })
    } else {
        return new Response('URL is not an image or video', { status: 400 })
    }
}