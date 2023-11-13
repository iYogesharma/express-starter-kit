import nodemailer, { SendMailOptions, Transporter } from 'nodemailer';
import config from 'config'
import Log from './logger';

class Mail {

    private _transport : Transporter;

    constructor() {
        this._transport = nodemailer.createTransport(config.get('mail'))
    }

    public send = (data: SendMailOptions ) => {

        const formatMailOptionData =  this.formattedMailOptionData(data);

        if( formatMailOptionData ) {
            console.log( formatMailOptionData)
            this._transport.sendMail( data, (err,info) => {
                if( err )  {
                    Log.info(err);
                } else {
                    return info.response;
                }
            })
        }
       
    }

    private formattedMailOptionData( data: SendMailOptions ) {
        if( !data.from ){
            data.from = config.get('mail.default.from')
        }

        if( !data.bcc ){
            data.bcc = config.get('mail.default.bcc')
        }

        if( !data.subject ){
            data.subject = config.get('mail.default.subject')
        }
        return data;
    }
}

export const mail = new Mail();