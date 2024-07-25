import nodemailer from "nodemailer";
import sequelize from "sequelize";
import database from "../../database";
import Setting from "../../models/Setting";
import { config } from "dotenv";
config();
interface UserData {
  companyId: number;
}
const SendMail = async (email: string, tokenSenha: string) => {
  const { hasResult, data } = await filterEmail(email);
  if (!hasResult) {
    return { status: 404, message: "Email não encontrado" };
  }
  const userData = data[0][0] as UserData;
  if (!userData || userData.companyId === undefined) {
    return { status: 404, message: "Dados do usuário não encontrados" };
  }
  const companyId = userData.companyId;
  const urlSmtp = process.env.MAIL_HOST;
  const userSmtp = process.env.MAIL_USER;
  const passwordSmpt = process.env.MAIL_PASS;
  const fromEmail = process.env.MAIL_FROM;
  const transporter = nodemailer.createTransport({
    host: urlSmtp,
    port: Number(process.env.MAIL_PORT),
    secure: true,
    auth: { user: userSmtp, pass: passwordSmpt }
  });
  if (hasResult === true) {
    const { hasResults, datas } = await insertToken(email, tokenSenha);
    async function sendEmail() {
      try {
        const mailOptions = {
          from: fromEmail,
          to: email,
          subject: "Redefinição de Senha - Mult Talk | SteemIT",
          html: ` 
		  <head>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Redefinição de Senha - Mult Talk | SteemIT</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            font-family: Arial, sans-serif;
            background-color: #6A0DAD;
            color: #000000;
        }

        .container {
            width: 100%;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            box-sizing: border-box;
        }

        .header {
            text-align: center;
            margin-bottom: 30px;
        }

        .content {
            background-color: #ffffff;
            padding: 30px;
            border-radius: 10px;
        }

        .footer {
            text-align: center;
            margin-top: 30px;
        }
    </style>
</head>

<body>
    <div class="container">
        <div class="header">
          </div>
        <div class="content">
            <p>Olá,</p>
            <p>Você solicitou a redefinição de senha. Utilize o código de verificação abaixo para concluir o processo:</p>
            <h2>Código de Verificação: ${tokenSenha}</h2>
            <p>Se não foi você quem solicitou a redefinição, ignore este e-mail.</p>
            <p>Atenciosamente,<br>Equipe de Suporte Mult Talk | SteemIT</p>
        </div>
        <div class="footer">
            <p>Este é um e-mail automático. Por favor, não responda.</p>
        </div>
    </div>
</body>

</html>`
        };
        const info = await transporter.sendMail(mailOptions);
        console.log("E-mail enviado: " + info.response);
      } catch (error) {
        console.log(error);
      }
    }
    sendEmail();
  }
};
const filterEmail = async (email: string) => {
  const sql = `SELECT * FROM "Users"  WHERE email ='${email}'`;
  const result = await database.query(sql, {
    type: sequelize.QueryTypes.SELECT
  });
  return { hasResult: result.length > 0, data: [result] };
};
const insertToken = async (email: string, tokenSenha: string) => {
  const sqls = `UPDATE "Users" SET "resetPassword"= '${tokenSenha}' WHERE email ='${email}'`;
  const results = await database.query(sqls, {
    type: sequelize.QueryTypes.UPDATE
  });
  return { hasResults: results.length > 0, datas: results };
};
export default SendMail;
