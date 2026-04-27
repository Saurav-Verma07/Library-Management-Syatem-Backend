import cron from 'node-cron';
import { User } from "../model/Usermodel.js";

export const removeunwantedverifyaccount=()=>{
    cron.schedule("*/5 * * * *",async()=>{
        const thirtyMonutesAgo=new Date(Date.now()-30*60*1000);
        await User.deleteMany({
            accountverified:false,
            createdAt:{$lt:thirtyMonutesAgo},
        });
    });
}