import { FC, useState, ChangeEvent } from "react";
import { useRef } from "react";
import emailjs from "emailjs-com";

const ContactPage: FC = () => {
  const form = useRef();
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

  const sendEmail = (e) => {
    e.preventDefault();

    emailjs
      .sendForm(
        "service_tgu49x5",
        "template_hicyvzi",
        form.current,
        "aHBKk1L7DqVNdw8r5"
      )
      .then(
        (result) => {
          console.log(result.text);
        },
        (error) => {
          console.log(error.text);
        }
      );
    setMessage("");
    setName("");
    setEmail("");
  };

  const style = {
    content: `flex flex-col justify-center mt-14 py-10`,
    heading: `text-[#fff] font-bold text-4xl md:text-6xl mb-20 text-center`,
    formWrap: `md:w-[500px] p-4 mx-auto mb-14 items-center bg-[#Fff] rounded-lg`,
    form: `p-4 mx-auto flex flex-col justify-center gap-4`,
  };

  return (
    <div className={style.content} id="contact">
      <h1 className={style.heading}>Contact</h1>
      <div className={style.formWrap}>
        <form ref={form} onSubmit={sendEmail} className={style.form}>
          <div>
            <input
              type="text"
              placeholder="Name"
              className="input bg-black text-[#fff] input-bordered w-full"
              value={name}
              onChange={handleNameChange}
              name="name"
            />
          </div>
          <div>
            <input
              type="email"
              placeholder="Email"
              className="input bg-black text-[#fff] input-bordered w-full"
              value={email}
              onChange={handleEmailChange}
              name="email"
            />
          </div>
          <div>
            <textarea
              placeholder="Enter Text here"
              className="textarea text-[#fff] bg-black textarea-bordered textarea-lg w-full"
              value={message}
              onChange={handleMessageChange}
              name="message"
            ></textarea>
          </div>
          <button className="btn btn-primary btn-md rounded-md">Send</button>
        </form>
      </div>
    </div>
  );
};

export default ContactPage;
