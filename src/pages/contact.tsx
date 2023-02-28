import { FC, useState, ChangeEvent } from "react";

const style = {
  content: `h-screen flex flex-col justify-center`,
  heading: `text-[#fff] font-bold text-4xl md:text-6xl mb-20 text-center`,
  formWrap: `md:w-[500px] p-4 mx-auto items-center bg-[#Fff] rounded-lg`,
    form:`p-4 mx-auto flex flex-col justify-center gap-4`,
};

const ContactPage: FC = () => {
  const [name, setName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [message, setMessage] = useState<string>("");

  const handleNameChange = (e: ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value);
  };

  const handleEmailChange = (e: ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
  };

    const handleMessageChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
  };

  return (
    <div className={style.content} id="contact">
      <h1 className={style.heading}>Contact</h1>
      <div className={style.formWrap}>
        <form className={style.form}>
          <div>
            <input
              type="text"
              placeholder="Name"
              className="input bg-black text-[#fff] input-bordered w-full"
              value={name}
              onChange={handleNameChange}
            />
          </div>
          <div>
            <input
              type="email"
              placeholder="Email"
              className="input bg-black text-[#fff] input-bordered w-full"
              value={email}
              onChange={handleEmailChange}
            />
          </div>
          <div>
            <textarea
              placeholder="Enter Text here"
              className="textarea text-[#fff] bg-black textarea-bordered textarea-lg w-full"
              value={message}
              onChange={handleMessageChange}
            ></textarea>
          </div>
          <button className="btn btn-primary btn-md rounded-md">Send</button>
        </form>
      </div>
    </div>
  );
};

export default ContactPage;

