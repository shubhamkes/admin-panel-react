import { IsUndefinedOrNull, BuildUrlForGetCall } from './common.utils';
import { CreateFinalColumns } from './generic.utils';
import { Get } from './http.utils';

/**
 * same as ConfigureDataForPortlet.getData
 * @param  {} data
 * @param  {} genericDetailObject
 * @param  {} params
 * @param  {} configuration
 */
export function GetDataForPortlet({ data, genericDetailObject, params, selectedColumns }) {
    var obj = {};
    obj.data = data.response;

    obj.dictionary = {};
    obj.relationship = {};

    obj.dictionary[genericDetailObject.starter] = data.dictionary[genericDetailObject.starter];
    obj.relationship[genericDetailObject.starter] = data.relationship[genericDetailObject.starter];

    if (!genericDetailObject.includes) {
        return obj;
    }

    const includes = genericDetailObject.includes.split(",");
    const inclusions = [];
    includes.forEach(item => {
        const toCheckColumn = item.split(".");
        let index = genericDetailObject.starter + "." + toCheckColumn[0];
        if (data.relationship[index] && data.relationship[index].alias_type == 164) {
            for (var i in toCheckColumn) {
                var name = parseInt(i) ? inclusions[inclusions.length - 1] + "." + toCheckColumn[i] : toCheckColumn[i];
                inclusions.push(name);
            }
        } else {
            delete obj.data[index];
        }

        for (i in inclusions) {
            index = genericDetailObject.starter + "." + inclusions[i];
            obj.relationship[index] = data.relationship[index];
            obj.dictionary[index] = data.dictionary[index];
        }
    });
    obj.includes = inclusions.join(",");
    params.includes = obj.includes;
    params.dictionary = obj.dictionary;
    params.relationship = data.relationship;
    const tempParams = params;
    obj.portletColumns = GetColumnsForDetail(tempParams);
    obj.finalColumns = CreateFinalColumns(obj.portletColumns, selectedColumns);

    // obj.scripts = InjectScriptFactory.returnMatchingScripts({
    //     preference: genericDetailObject.listName, scripts: genericDetailObject.scripts
    // });

    obj.starter = genericDetailObject.starter;
    return obj;
}

/**
 * returns columns array
 * same as menu service' getColumns
 * @param  {} params
 * @param  {} excludeStarter
 */
export function GetColumnsForDetail(params, excludeStarter) {
    var columns = [];
    var selectedColumns = {};
    if (!params && typeof (params) != "object") {
        alert("Expected Params as object, Contact Admin");
        return false;
    }

    var relationship = params.relationship;

    var includes = params.includes.split(",");
    for (var i in includes) {
        includes[i] = params.starter + "." + includes[i];
        includes[i] = includes[i].toLowerCase();
    } !excludeStarter ? includes.unshift(params.starter) : null;
    for (var i in includes) {
        columns[includes[i]] = params.dictionary[(includes[i])];
    }
    // columns = params.dictionary;
    for (var i in columns) {
        var data = columns[i];
        for (var j in columns[i]) {
            var element = i + "." + columns[i][j].column_name;

            columns[i][j]["absPath"] = element.replace(/\.?([A-Z]+)/g, function (x, y) {
                return "_" + y.toLowerCase();
            }).replace(/^_/, "").replace(params.starter, "").replace(".", "");
            columns[i][j]["path"] = columns[i][j]["absPath"].split(/\.(.+)?/)[1];
            columns[i][j]["parent"] = i;

            var relationIndex = columns[i][j]["parent"];
            if (!IsUndefinedOrNull(relationship) && relationship.hasOwnProperty(relationIndex) && relationship[relationIndex].hasOwnProperty('related_model')) {
                columns[i][j].reference_route = relationship[relationIndex].related_model.state_name;
                columns[i][j].parentColumn = relationship[relationIndex].related_column ? relationship[relationIndex].related_column.column_name : null;
            }

            selectedColumns[columns[i][j].parent + "." + columns[i][j].id] = columns[i][j];
        }
    }
    return selectedColumns;
};

/**
 * Fetches data for detail page
 * same as ConfigureDataForDirective
 * @param  {object} genericDetailObject - urlParameter
 */
export function GetDetailRecord({ configuration: genericDetailObject, callback, urlParameter }) {
    const params = Initialization(genericDetailObject);
    const options = {};

    if (params.includes) {
        options.includes = params.includes;
    }
    options.dictionary = params.dictionary ? false : true;
    const module = CreateUrl({ url: genericDetailObject.url, urlParameter });
    if (!module) {
        alert("No Url has been set for this menu, Contact Admin");
        return false;
    }

    // flag to check promise

    const url = BuildUrlForGetCall(module, options);
    Get({ url, callback: PrepareObjectForDetailPage, extraParams: { callback, params, genericDetailObject } });
}

/**
 * returns segregated data for tabs
 * by iterateing over all inclusions in data 
 * and adds extra properties required for rending and actions on individual tab
 */
export function CategorizeDataForTabs(data) {
    // const resolve = [];
    const includes = data.includes.split(",");
    const tabs = [];
    const preferences = {};

    for (const i in includes) {
        const tab = {};
        const inclusions = includes[i].split(".");
        const index = data.starter + "." + inclusions[0];
        const relationship = data.relationship[index];

        tab.name = relationship.alias_name;
        tab.image = relationship.image;
        const configure = data.dictionary[index];
        tab.relationship = relationship;

        tab.index = index;
        tab.path = relationship.route_name;
        tab.identifier = inclusions[0];
        tab.listName = data.starter + "." + inclusions[0] + ".list";
        tab.formName = data.starter + "." + inclusions[0] + ".form";
        tab.preference = "";
        tab.fixedParams = data.fixedParams;
        tab.callFunction = data.callFunction;
        tab.scripts = [];

        // check if there are other includes of the same identifier
        let finalIncludes = includes[i];
        for (const j in includes) {
            if (includes[i] != includes[j]) {
                if (includes[j].split(".")[0] == inclusions[0]) {
                    finalIncludes += "," + includes[j];
                    delete includes[j];
                }
            }
        }

        var params = {
            includes: CreateInclusions(finalIncludes), starter: data.starter, dictionary: {}
        };

        var dictionary = params.includes.split(",");
        for (var k in dictionary) {
            var dicIndex = data.starter + "." + dictionary[k];
            params.dictionary[dicIndex] = data.dictionary[dicIndex];
        }
        params.relationship = data.relationship;
        tab.columns = GetColumnsForDetail(params);


        params.includes = inclusions[0];
        params.dictionary = {};
        params.dictionary[index] = configure;

        tab.configure = GetColumnsForDetail(params, 1);

        tab.actions = relationship.actions;

        // var scripts = InjectScriptFactory.returnMatchingScripts({
        //     preference: index, scripts: self.responseArray.scripts, searchConstraint: "startsWith"
        // });
        // Array.prototype.push.apply(tab.scripts, scripts);

        preferences[tab.identifier] = relationship.preferences[tab.listName] ? JSON.parse(relationship.preferences[tab.listName]) : null;
        tab.formPreferences = relationship.preferences[tab.formName] ? JSON.parse(relationship.preferences[tab.formName]) : null;

        tab.finalColumns = CreateFinalColumns(tab.columns, preferences[tab.identifier], params.relationship);

        // const localResolve = {
        //     resolve: {
        //         modelAliasId: relationship.id
        //     }
        // };

        // resolve.push(localResolve);
        tabs.push(tab);
    }
    return { tabs };
}

/**
 * same as ConfigureDataForTab.getData
 * @param  {Object} {data - actual data object
 * @param  {Object} genericDetailObject} - meta data about menu
 */
function GetDataForTabs({ data, genericDetailObject }) {
    if (IsUndefinedOrNull(data)) {
        alert("No Data Returned for this menu");
        // swl.info("No Data Returned for this menu");
        return false;
    }

    const obj = {};
    obj.data = {};
    obj.relationship = {};
    obj.dictionary = {};
    obj.includes = {};
    obj.scripts = [];

    if (!genericDetailObject.includes) {
        return obj;
    }

    var includes = genericDetailObject.includes.split(",");
    var inclusions = [];
    includes.forEach(item => {
        const toCheckColumn = item.split(".");
        const index = genericDetailObject.starter + "." + toCheckColumn[0];

        // const scripts = InjectScriptFactory.returnMatchingScripts({
        //     preference: index, scripts: genericDetailObject.scripts, searchConstraint: "startsWith"
        // });
        // if (scripts.length) {
        //     Array.prototype.push.apply(obj.scripts, scripts);
        // }

        if (data.relationship[index] && data.relationship[index].alias_type == 163) {
            inclusions.push(item);
            let name = genericDetailObject.starter;
            for (var i in toCheckColumn) {
                name += "." + toCheckColumn[i];
                obj.relationship[name] = data.relationship[name];
                obj.dictionary[name] = data.dictionary[name];
            }
            obj.data[index] = data.response[toCheckColumn[0]];
        }
    });
    obj.includes = inclusions.join(",");
    obj.starter = genericDetailObject.starter;

    // obj.scripts =

    return obj;
};

/**
 * Invoked when actual data for generic detail is fetched to process further and again callbacks with final data and columns list
 * @param  {object} result
 * @param  {object} {extraParams}
 */
function PrepareObjectForDetailPage(result, { extraParams }) {
    const { callback, params, genericDetailObject } = extraParams;
    const data = result;
    if (IsUndefinedOrNull(data)) {
        // swl.info("No Data Returned for this menu");
        alert("No Data Returned for this menu");
        return false;
    }
    // flag to check promise
    params.dictionary = data.dictionary || params.dictionary;

    // var previousColumns = MenuService.getPreviousColumns(params);
    // genericDetailObject.preference = HealPreferenceFactory.listing(genericDetailObject.preference, previousColumns);
    // for (var i in data.relationship) {
    //     previousColumns = MenuService.getPreviousColumnsForListing(params);
    //     if (typeof data.relationship[i] == "object" && data.relationship[i].hasOwnProperty("preferences")) {
    //         data.relationship[i].preferences = HealPreferenceFactory.listing(data.relationship[i].preferences, previousColumns);
    //     }
    // }

    const listPortlet = genericDetailObject.listName + ".detail.list";
    const selectedColumns = genericDetailObject.preference[listPortlet] ? JSON.parse(genericDetailObject.preference[listPortlet]) : null;

    const tabs = GetDataForTabs({ data, genericDetailObject });
    // tabs.parentData = data.response;
    // tabs.fixedParams = EvalQuery.eval(genericDetailObject.query, data.response);

    const portlet = GetDataForPortlet({ data, genericDetailObject, params, selectedColumns });
    portlet.listName = listPortlet;
    // tabs.callFunction = {
    //     callback: configureDataForDirective
    // };

    if (typeof callback == 'function') {
        callback({
            portlet,
            tabs
        });
    }
}

/**
 * Evaluates value against url
 * @param  {} url
 */
function CreateUrl({ url, urlParameter }) {
    if (!url) {
        return false;
    }
    var reg = /([:$])\w+/g;
    var params = url.match(reg);
    if (!params || !params.length) {
        return url;
    }
    for (var i in params) {
        // url = url.replace(params[i], $stateParams[params[i].split(":")[1]]);
        const key = params[i];

        url = url.replace(key, urlParameter[key.substr(1)]);
    }
    return url;
}

function Initialization(genericDetailObject) {
    return {
        includes: genericDetailObject.includes, starter: genericDetailObject.starter
    };
}

/**
 * Creates array of inclusion string attached with starter
 * @param  {} includes
 */
function CreateInclusions(includesString) {
    const arr = [];
    let starter = "";
    const includes = includesString.split(",");
    for (const k in includes) {
        const inclusions = includes[k].split(".");
        for (const i in inclusions) {
            const name = parseInt(i) ? starter + "." + inclusions[i] : inclusions[i];
            starter = name;
            if (arr.indexOf(name) == -1) {
                arr.push(name);
            }
        }
    }
    return arr.join(",");
};
