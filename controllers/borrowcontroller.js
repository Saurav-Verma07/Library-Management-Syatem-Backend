import catchAsyncErrors from "../middlewares/catchAsyncErrors.js";
import ErrorHandler from "../middlewares/errorMiddleware.js";
import { User } from "../model/Usermodel.js";
import { Borrow } from "../model/borrowmodel.js";
import { Book } from "../model/bookmodel.js";
import { calculateFine } from "../utils/Finecalculate.js";

//recordborrowedbook
export const recordBorrowedBook = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;
  const { email } = req.body;

  const book = await Book.findById(id);
  if (!book){
     return next(new ErrorHandler("Book Not Found", 404));
}
  const user = await User.findOne({ email,accountVerified:true});
  if (!user){
     return next(new ErrorHandler("User Not Found", 404));
}
  if (book.quantity === 0){
     return next(new ErrorHandler("Book Not Available", 400));
}
  const isAlreadyBorrowed = user.borrowedBooks.find(
    (b) => b.bookId.toString() === id && b.returned === false
  );

  if (isAlreadyBorrowed){
    return next(new ErrorHandler("Book Already Borrowed", 400));
}
  book.quantity -= 1;
  book.availability = book.quantity > 0;
  await book.save();

    user.borrowedBooks.push({
    bookId: book._id,
    bookTitle: book.title,
    borrowDate: new Date(),
    dueDate:new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  });
  await user.save();

  await Borrow.create({
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
         },
      book: book._id,
      dueDate:new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      price: book.price,
 
  });

  res.status(200).json({
    success: true,
    message: "Borrowed Book Recorded Successfully",
  });
});

//borrowedbooks
export const borrowedBooks=catchAsyncErrors(async(req,res,next)=>{
const {borrowedBooks}=req.user;
res.status(200).json({
  success:true,
  borrowedBooks, 
});

})

//getborrowedbookforAdmin
export const getBorrowedBookforAdmin=catchAsyncErrors(async(req,res,next)=>{

  const borrowedBooks=await Borrow.find();
res.status(200).json({
  success:true,
  borrowedBooks,
});

})

//returnborrowedbook
export const returnBorrowBook=catchAsyncErrors(async(req,res,next)=>{
  const {bookid}=req.params;
  const {email}=req.body;
  const book=await Book.findById(bookid);
  if(!book){ 
    return next(new ErrorHandler("Book Not Found",404));
    }
  const user=await User.findOne({email, accountVerified:true});
  if(!user){
    return next(new ErrorHandler("User Not Found",404));
  }
  const borrowedBook=user.borrowedBooks.find(
    (b)=>b.bookId.toString()===bookid && b.returned===false
  );
  if(!borrowedBook){
    return next(new ErrorHandler("You have not Borrowed this Book",400));
    }
  book.returned=true;
  await book.save();
  book.quantity+=1;
  book.availability=book.quantity > 0;
  await book.save();
  const borrow=await Borrow.findOne({
    book:bookid,
    "user.email":email,
    returnDate:null,
  });
  if(!borrow){ 
       return next(new ErrorHandler("You have not Borrowed this Book",404));
    }

  borrow.returnDate=new Date();
  const fine=calculateFine(borrow.dueDate);
  borrow.fine=fine;
  await borrow.save();
  res.status(200).json({
    success:true,
    message:fine!==0?
     `The book is returned successfully.The total charges,Including fine, are $${fine + book.price  }`
   :`The book is returned successfully.The total charges are $${book.price}`,
  })

  }); 














