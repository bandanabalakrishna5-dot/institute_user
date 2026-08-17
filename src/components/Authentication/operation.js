import { b2cLogin } from '../../services/LoginServices/loginServices';

export const loginUserValidate = async (obj) => {
  let login_res = undefined;
  try {
    const response = await b2cLogin(obj);
    if (response && response.status === 'success') {
      login_res = response;
    } else {
      login_res = response;
    }
  } catch (e) {
    login_res = undefined;
  }
  return Promise.resolve(login_res);
};
