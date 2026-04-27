import cron from "node-cron";
import { Borrow } from "../model/borrowmodel.js";
import sendEmail from "../utils/sendEmail.js";

export const notifyUsers = () => {
  cron.schedule("*/30 * * * *", async () => {
try{
  const oneDayAgo=new Date(Date.now()-24*60*60*1000)
  const borrowers=await Borrow.find({
dueDate:{
  $lte:oneDayAgo
},
returnDate:null,
notified:false,


    
  })


for(const element of borrowers){
  if(element.user && element.user.email){
    
    sendEmail({
      email: element.user.email,
      subject:"Book Return Reminder",
      message: `Dear ${element.user.name},\n\n
 This is a reminder that the book you borrowed is due for return today.
 Please return the book to  the library as soon as possible.\n\n

     Thank you,
        Team 
  Library Management System`,


    })
    element.notified=true
    await element.save()
  
    console.log(`email send to ${element.user.email}`);
  
  }
}

}catch(error){
  console.log("Some error accured while notifying User",error)
}
 


});
};
































































    //     try {
//       const today = new Date();

//       const borrowers = await Borrow.find({
//         dueDate: { $lte: today },
//         returnDate: null,
//         "user.notified": false,
//       });

//       for (const item of borrowers) {
//         if (!item.user || !item.user.email) continue;

//         await sendEmail({
//           email: item.user.email,
//           subject: "Book Due Date Reminder",
//           message: `Dear ${item.user.name},
// This is a reminder that the book you borrowed is due today.
// Please return it to the library as soon as possible.

// Thank you,
// Team Library Management System`,
//         });

//         item.user.notified = true;
//         await item.save();
//         console.log('====================================');
//         console.log(`email sent to ${ item.user.notified}`);
//         console.log('====================================');

//         console.log(`Email sent to ${item.user.email}`);
//       }
//     } catch (error) {
//       console.log("Error in notifying users:", error);
//     }
