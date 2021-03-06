/**
 * Modal wrapper 
 * Accepts various props such as isVisible(boolean), headerText, modalHeader, modalBody, modalFooter, closeModal(function)
 * To render header, either pass modalHeader component or header text
 * rest modalBody and modalFooter is optional
 * 
 * e.g. 
 * <ModalWrap 
 *    isVisible={isVisible}
 *    headerText="tesfh" 
 *    modalBody={() => (<h1> hudgdub</h1>)} 
 *    closeModal={() => this.setState({ isVisible: false })}
 * />
 */

import React, { Component } from 'react';
import { Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap';

export default class ModalWrapper extends Component {
    constructor(props) {
        super(props);
        this.state = {
            ...props
        }
    }

    componentWillReceiveProps(nextProps) {
        if (this.state.isVisible != nextProps.isVisible) {
            this.setState({ isVisible: nextProps.isVisible });
        }
    }

    openModal = ({ ...args }) => {
        // this.state.modalBody = null;
        this.setState({ isVisible: true, ...args });
    }

    closeModal = () => {
        const { onClose } = this.state;
        this.setState({ isVisible: false });
        if (typeof onClose == 'function') {
            onClose();
        }
    }

    render() {
        const { headerText, modalHeader, modalBody, modalFooter } = this.state;
        const { isVisible } = this.state;

        return (
            <Modal isOpen={isVisible} toggle={this.closeModal} className={this.props.className} backdrop={this.state.backdrop}>
                {
                    modalHeader ?
                        <ModalHeader toggle={this.closeModal}>{modalHeader()}</ModalHeader>
                        :
                        headerText ?
                            <ModalHeader toggle={this.closeModal}>{headerText}</ModalHeader>
                            : null
                }

                {
                    modalBody &&
                    <ModalBody>
                        {modalBody()}
                    </ModalBody>
                }

                {
                    modalFooter &&
                    <ModalFooter>
                        {/* <Button color="primary" onClick={this.toggle}>Do Something</Button>{' '}
                    <Button color="secondary" onClick={this.toggle}>Cancel</Button> */}
                        {modalFooter()}
                    </ModalFooter>
                }
            </Modal>
        )
    }
}
