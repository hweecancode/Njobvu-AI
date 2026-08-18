const queries = require("../../queries/queries");

async function transferAdmin(req, res) {
    var PName = req.body.PName,
        Admin = req.body.Admin,
        IDX = parseInt(req.body.IDX),
        user = req.cookies.Username,
        validation = req.body.validation;

    var NewAdmin = req.body.NewAdmin;

    var adminProjects = await db.getAsync(
    	"SELECT COUNT(*) AS count FROM Projects WHERE Admin = ? AND PName = ?",
        [NewAdmin, PName]
    );

    if (adminProjects.count != 0) {
        return res.redirect("/config?IDX=" + IDX);
    }

    try {
        await queries.managed.sql("PRAGMA foreign_keys=off");
        await queries.managed.sql(
            "UPDATE Projects SET Admin = ? WHERE Admin = ? AND PName = ?",
            [NewAdmin, user, PName],
        );
        await queries.managed.sql(
            "UPDATE Access SET Admin = ? WHERE Admin = ? AND PName = ?",
            [NewAdmin, user, PName],
        );
        await queries.managed.sql("PRAGMA foreign_keys=on");
    } catch (err) {
        global.logger.error(err);
        return res.status(500).send("Erorr transferring admin role");
    }

    var publicPath = currentPath,
        mainPath = publicPath + "public/projects/", // $LABELING_TOOL_PATH/public/projects/
        projectPath = mainPath + Admin + "-" + PName,
        newPath = mainPath + NewAdmin + "-" + PName; // $LABELING_TOOL_PATH/public/projects/project_name

    fs.renameSync(projectPath, newPath);

    await queries.managed.sql(
        "UPDATE Access SET Project_Parent = ? WHERE PName = ?",
        [PName, PName],
    );

    if (validation) return res.redirect("/configV?IDX=" + IDX);
    return res.redirect("/config?IDX=" + IDX);
}

module.exports = transferAdmin;
