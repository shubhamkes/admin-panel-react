import React, { Component } from 'react';

import {
    Table, Card, CardImg, CardText, CardBody,
    CardTitle, CardSubtitle, Dropdown, DropdownToggle, DropdownMenu, DropdownItem
} from 'reactstrap';

import './genericListing.css';
import { GetUrlParams } from './../../Utils/location.utils';
import { GetMenuDetail, ConvertMenuDetailForGenericPage, CreateFinalColumns } from './../../Utils/generic.utils';
import { GetListingRecord } from './../../Utils/genericListing.utils';


import ListingPagination from './../../Components/Listing-Pagination/ListingPagination';
import TableSettings from './../../Components/Table-Settings/TableSettings';
import PortletTable from './../../Components/Portlet-Table/PortletTable';
import CustomAction from './../../Components/Custom-Action/CustomAction';

import ModalManager from './../../Custom-Components/Modal-Wrapper/modalManager';
import ModalWrap from './../../Custom-Components/Modal-Wrapper/modalWrapper.component';

export default class GenericListing extends Component {
    constructor(props) {
        super(props);
        this.state = {
            ...GetUrlParams(this.props), // params, queryString
            menuDetail: {},
            genericData: {},
        };
    }

    componentDidMount() {
        this.getMenuData();
        // ModalManager.showModal({ onClose: this.closeModal, headerText: '1st using method', modalBody: () => (<h1> hi</h1>) });
    }

    getMenuData = async () => {
        const { queryString } = this.state;
        const { menuId, limit, page } = this.props;
        const result = await GetMenuDetail(menuId);
        if (result.success) {

            const { response = {} } = result;
            const menuDetail = ConvertMenuDetailForGenericPage(response || {});
            if (typeof response.controller_path == 'string' && response.controller_path.includes('genericListingController.js') != -1) {
                // this.setState({ menuDetail });
                this.state.menuDetail = menuDetail
                this.getListingData();
            }
        }
    }

    getListingData = () => {
        const { menuDetail, genericData, queryString } = this.state;
        GetListingRecord({ configuration: menuDetail, callback: this.dataFetched, data: genericData, queryString });
    }

    dataFetched = (genericData) => {
        // const totalPages = Math.ceil((genericData.stats.records / genericData.stats.count));

        // if (totalPages > 7) {
        //     // this.setState({ pagesOnDisplay: 7 });
        //     this.state.pagesOnDisplay = 7;
        // } else {
        //     // this.setState({ pagesOnDisplay: totalPages });
        //     this.state.pagesOnDisplay = Math.ceil(totalPages);
        // }
        this.setState({ genericData });
    }


    layoutChanges = (selectedColumns) => {
        let { genericData } = this.state;
        genericData.selectedColumns = selectedColumns;
        genericData.finalColumns = CreateFinalColumns(genericData.columns, selectedColumns, genericData.relationship);
        this.setState({ genericData });
    }

    render() {
        const { genericData = {}, pagesOnDisplay, menuDetail = {} } = this.state;
        const { listing = [], finalColumns = [] } = genericData;
        const { history } = this.props;

        return (
            <div className="generic-listing-container">
                {/* <ModalWrap
                    isVisible
                    headerText="tesfh"
                    modalBody={() => (<h1> h2</h1>)}
                    closeModal={() => this.setState({ isVisible: false })}
                /> */}
                <div className="page-bar">
                    <div className="search-wrapper">

                    </div>
                    <div className="header-actions">

                        <div className="btn-group" role="group" aria-label="Basic example">
                            {/* <button type="button" className="btn btn-sm btn-secondary">Left</button>
                            <button type="button" className="btn btn-sm btn-secondary">Middle</button>
                            <button type="button" className="btn btn-sm btn-secondary">Right</button> */}

                            <CustomAction history={history} genericData={genericData} actions={genericData.nextActions} placement={168} />

                            {
                                genericData.columns ?
                                    <TableSettings onSubmit={this.layoutChanges} listName={genericData.listName} selectedColumns={genericData.selectedColumns} columns={genericData.columns} />
                                    :
                                    null
                            }
                        </div>
                    </div>
                </div>
                <Card>
                    <CardBody>
                        {
                            (finalColumns && finalColumns.length) ?
                                <PortletTable history={history} genericData={genericData} finalColumns={finalColumns} listing={listing} /> : null
                        }
                        <ListingPagination genericData={genericData} />
                    </CardBody>
                </Card>
            </div>
        );
    }
}