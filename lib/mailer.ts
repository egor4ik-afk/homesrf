import nodemailer from 'nodemailer';
import { DOWNLOADS_URL } from './constants';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 465),
  secure: process.env.SMTP_SECURE !== 'false',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const FROM = process.env.SMTP_FROM || 'RelaxNet <no-reply@relaxnet.pro>';

export async function sendOtpEmail(to: string, code: string) {
  await transporter.sendMail({
    from: FROM,
    to,
    subject: `${code} — код для входа в RelaxNet`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:420px;margin:0 auto;padding:24px">
        <h2 style="margin:0 0 16px">RelaxNet</h2>
        <p style="color:#444">Ваш код для входа:</p>
        <div style="font-size:32px;font-weight:700;letter-spacing:6px;margin:16px 0">${code}</div>
        <p style="color:#888;font-size:13px">Код действует 10 минут. Если это были не вы — просто проигнорируйте письмо.</p>
      </div>
    `,
  });
}

export async function sendVpnKeyEmail(to: string, vpnKey: string, tarifName: string) {
  await transporter.sendMail({
    from: FROM,
    to,
    subject: 'Ваш VPN-ключ RelaxNet',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;padding:24px">
        <h2 style="margin:0 0 8px">RelaxNet ${tarifName}</h2>
        <p style="color:#444">Оплата прошла успешно. Вот ваш ключ подключения:</p>
        <div style="background:#f4f4f4;padding:12px 16px;border-radius:8px;
                    font-family:monospace;font-size:13px;word-break:break-all;margin:16px 0">
          ${vpnKey}
        </div>
        <p style="color:#444">
          1. Скачайте клиент Amnezia для вашего устройства:
          <a href="${DOWNLOADS_URL}">${DOWNLOADS_URL}</a><br/>
          2. Откройте приложение → «Добавить подключение» → «Вставить ключ».<br/>
          3. Вставьте ключ выше и нажмите «Подключиться».
        </p>
        <p style="color:#888;font-size:13px">
          Ключ также хранится в вашем профиле на relaxnet.pro.
        </p>
      </div>
    `,
  });
}

export async function sendRenewalEmail(to: string) {
  await transporter.sendMail({
    from: FROM,
    to,
    subject: 'Подписка RelaxNet продлена',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:420px;margin:0 auto;padding:24px">
        <h2 style="margin:0 0 8px">RelaxNet</h2>
        <p style="color:#444">Оплата прошла, подписка продлена ещё на месяц.
        Ключ подключения не изменился — ничего перенастраивать не нужно.</p>
        <p style="color:#888;font-size:13px">Управление подпиской — в профиле на relaxnet.pro.</p>
      </div>
    `,
  });
}