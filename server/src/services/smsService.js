const axios = require('axios');

const OTP_API_URL = 'https://appapi.advaitdigital.co.in/api/smsapi';
const OTP_TEMPLATE = (name, code) =>
  `Dear ${name}, Your Login OTP for Shop Advait is ${code}. Please do not share this OTP with anyone.\nRegards,\nAdvait Teleservices.`;

const rejectedByProvider = (data) => {
  if (data && typeof data === 'object') {
    if (data.error || data.success === false || data.status === false || data.status === 0) return true;
    if (/^(error|failed|failure|invalid|false|0)$/i.test(String(data.status ?? ''))) return true;
    if (/^(error|failed|failure)$/i.test(String(data.type ?? ''))) return true;
    if ((typeof data.code === 'number' && data.code >= 400) ||
        (typeof data.statusCode === 'number' && data.statusCode >= 400)) return true;
  }
  if (typeof data === 'string') return /^(error|failed|invalid|unauthorized)\b|^\s*<!?html/i.test(data.trim());
  return false;
};

class SmsService {
  constructor() {
    this.apiKey = process.env.SMS_API_KEY || '';
    this.route = process.env.SMS_ROUTE || '38';
    this.sender = process.env.SMS_SENDER || 'ADAVAT';
    this.templateId = process.env.SMS_TEMPLATE_ID || '1777179542196464728';
    this.gatewayUrl = process.env.SMS_GATEWAY_URL || '';
    this.notificationUrl = process.env.SMS_NOTIFICATION_URL || '';
    this.devMode = process.env.NODE_ENV !== 'production' && process.env.SMS_DEV_MODE === 'true';
  }

  async sendProviderOtp(mobile, code, name) {
    const firstName = typeof name === 'string' ? name.trim().split(/\s+/)[0].replace(/[^a-zA-Z]/g, '').slice(0, 30) : '';
    try {
      const response = await axios.get(OTP_API_URL, {
        params: {
          key: this.apiKey,
          route: this.route,
          sender: this.sender,
          number: mobile,
          sms: OTP_TEMPLATE(firstName || 'Customer', code),
          templateid: this.templateId,
        },
        timeout: 10000,
        maxRedirects: 0,
      });
      if (rejectedByProvider(response.data)) {
        console.error('SMS provider rejected OTP request.');
        return { success: false, error: 'SMS provider rejected the request' };
      }
      return { success: true, channel: 'advait_digital' };
    } catch (error) {
      console.error('SMS provider request failed:', error.response?.status || error.code || 'unknown error');
      return { success: false, error: 'SMS provider request failed' };
    }
  }

  async sendMessage(mobile, message, code = '', url = this.gatewayUrl) {
    if (this.devMode) return { success: true, channel: 'development' };
    if (!url) return { success: false, error: 'SMS gateway is not configured' };
    try {
      const requestUrl = url
        .replace(/\{mobile\}|\{phone\}/gi, encodeURIComponent(mobile))
        .replace(/\{otp\}|\{code\}/gi, encodeURIComponent(code))
        .replace(/\{message\}/gi, encodeURIComponent(message));
      const response = await axios.get(requestUrl, { timeout: 10000, maxRedirects: 0 });
      if (rejectedByProvider(response.data)) return { success: false, error: 'SMS gateway rejected the request' };
      return { success: true, channel: 'sms_gateway' };
    } catch (error) {
      console.error('SMS delivery failed:', error.response?.status || error.code || 'unknown error');
      return { success: false, error: 'SMS delivery failed' };
    }
  }

  sendOtp(mobile, code, name) {
    if (this.devMode) return Promise.resolve({ success: true, channel: 'development' });
    if (this.apiKey) return this.sendProviderOtp(mobile, code, name);
    return this.sendMessage(mobile, `Your Advait Teleservices verification code is ${code}. It expires in 5 minutes.`, code);
  }

  sendCustomSms(mobile, message) {
    if (!this.notificationUrl) return Promise.resolve({ success: false, error: 'Shipment SMS gateway is not configured' });
    return this.sendMessage(mobile, message, '', this.notificationUrl);
  }
}

module.exports = new SmsService();
