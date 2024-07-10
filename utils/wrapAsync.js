module.exports = (fn) => {
    retun (req,res,next) => {
        fn(req,res,next).catch(next);
    };
};