export const URI = 'http://192.168.6.207:3050/omnimind'
export const Data_mqtt = {
  protocol: 'ws',
  host: '200.54.121.190',
  port: 8083,
  clientId: 'emqx_vue3_' + Math.random().toString(16).substring(2, 8),
  username: 'andres',
  password: 'colocolo',
  clean: true,
  connectTimeout: 30 * 1000,
  reconnectPeriod: 4000,
}
