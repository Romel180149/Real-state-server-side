const logout = async (req, res) => {
    const user = req.body;
  
    res
      .clearCookie("token", { maxAge: 0, sameSite: "none", secure: true })
      .send({ success: true });
  };
  
  module.exports = logout;
  