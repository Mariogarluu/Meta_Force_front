'use strict';

customElements.define('compodoc-menu', class extends HTMLElement {
    constructor() {
        super();
        this.isNormalMode = this.getAttribute('mode') === 'normal';
    }

    connectedCallback() {
        this.render(this.isNormalMode);
    }

    render(isNormalMode) {
        let tp = lithtml.html(`
        <nav>
            <ul class="list">
                <li class="title">
                    <a href="index.html" data-type="index-link">credentials documentation</a>
                </li>

                <li class="divider"></li>
                ${ isNormalMode ? `<div id="book-search-input" role="search"><input type="text" placeholder="Type to search"></div>` : '' }
                <li class="chapter">
                    <a data-type="chapter-link" href="index.html"><span class="icon ion-ios-home"></span>Getting started</a>
                    <ul class="links">
                                <li class="link">
                                    <a href="overview.html" data-type="chapter-link">
                                        <span class="icon ion-ios-keypad"></span>Overview
                                    </a>
                                </li>

                            <li class="link">
                                <a href="index.html" data-type="chapter-link">
                                    <span class="icon ion-ios-paper"></span>
                                        README
                                </a>
                            </li>
                                <li class="link">
                                    <a href="dependencies.html" data-type="chapter-link">
                                        <span class="icon ion-ios-list"></span>Dependencies
                                    </a>
                                </li>
                                <li class="link">
                                    <a href="properties.html" data-type="chapter-link">
                                        <span class="icon ion-ios-apps"></span>Properties
                                    </a>
                                </li>

                    </ul>
                </li>
                    <li class="chapter modules">
                        <a data-type="chapter-link" href="modules.html">
                            <div class="menu-toggler linked" data-bs-toggle="collapse" ${ isNormalMode ?
                                'data-bs-target="#modules-links"' : 'data-bs-target="#xs-modules-links"' }>
                                <span class="icon ion-ios-archive"></span>
                                <span class="link-name">Modules</span>
                                <span class="icon ion-ios-arrow-down"></span>
                            </div>
                        </a>
                        <ul class="links collapse " ${ isNormalMode ? 'id="modules-links"' : 'id="xs-modules-links"' }>
                            <li class="link">
                                <a href="modules/TemplatePlaygroundModule.html" data-type="entity-link" >TemplatePlaygroundModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                            'data-bs-target="#components-links-module-TemplatePlaygroundModule-a48e698b66bad8be9ff3b78b5db8e15ee6bb54bd2575fdb1bb61a34e76437cc54b2e161854c3d6c97b4c751d05ff3a43b70b87ceffd46d3c5bf53f6f161e3044"' : 'data-bs-target="#xs-components-links-module-TemplatePlaygroundModule-a48e698b66bad8be9ff3b78b5db8e15ee6bb54bd2575fdb1bb61a34e76437cc54b2e161854c3d6c97b4c751d05ff3a43b70b87ceffd46d3c5bf53f6f161e3044"' }>
                                            <span class="icon ion-md-cog"></span>
                                            <span>Components</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="components-links-module-TemplatePlaygroundModule-a48e698b66bad8be9ff3b78b5db8e15ee6bb54bd2575fdb1bb61a34e76437cc54b2e161854c3d6c97b4c751d05ff3a43b70b87ceffd46d3c5bf53f6f161e3044"' :
                                            'id="xs-components-links-module-TemplatePlaygroundModule-a48e698b66bad8be9ff3b78b5db8e15ee6bb54bd2575fdb1bb61a34e76437cc54b2e161854c3d6c97b4c751d05ff3a43b70b87ceffd46d3c5bf53f6f161e3044"' }>
                                            <li class="link">
                                                <a href="components/TemplatePlaygroundComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >TemplatePlaygroundComponent</a>
                                            </li>
                                        </ul>
                                    </li>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-TemplatePlaygroundModule-a48e698b66bad8be9ff3b78b5db8e15ee6bb54bd2575fdb1bb61a34e76437cc54b2e161854c3d6c97b4c751d05ff3a43b70b87ceffd46d3c5bf53f6f161e3044"' : 'data-bs-target="#xs-injectables-links-module-TemplatePlaygroundModule-a48e698b66bad8be9ff3b78b5db8e15ee6bb54bd2575fdb1bb61a34e76437cc54b2e161854c3d6c97b4c751d05ff3a43b70b87ceffd46d3c5bf53f6f161e3044"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-TemplatePlaygroundModule-a48e698b66bad8be9ff3b78b5db8e15ee6bb54bd2575fdb1bb61a34e76437cc54b2e161854c3d6c97b4c751d05ff3a43b70b87ceffd46d3c5bf53f6f161e3044"' :
                                        'id="xs-injectables-links-module-TemplatePlaygroundModule-a48e698b66bad8be9ff3b78b5db8e15ee6bb54bd2575fdb1bb61a34e76437cc54b2e161854c3d6c97b4c751d05ff3a43b70b87ceffd46d3c5bf53f6f161e3044"' }>
                                        <li class="link">
                                            <a href="injectables/HbsRenderService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >HbsRenderService</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/TemplateEditorService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >TemplateEditorService</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/ZipExportService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >ZipExportService</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                </ul>
                </li>
                    <li class="chapter">
                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ? 'data-bs-target="#components-links"' :
                            'data-bs-target="#xs-components-links"' }>
                            <span class="icon ion-md-cog"></span>
                            <span>Components</span>
                            <span class="icon ion-ios-arrow-down"></span>
                        </div>
                        <ul class="links collapse " ${ isNormalMode ? 'id="components-links"' : 'id="xs-components-links"' }>
                            <li class="link">
                                <a href="components/AiChatComponent.html" data-type="entity-link" >AiChatComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/AppComponent.html" data-type="entity-link" >AppComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/CentersComponent.html" data-type="entity-link" >CentersComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/ClasesComponent.html" data-type="entity-link" >ClasesComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/ContactComponent.html" data-type="entity-link" >ContactComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/DashboardComponent.html" data-type="entity-link" >DashboardComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/DietsComponent.html" data-type="entity-link" >DietsComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/ErrorToastComponent.html" data-type="entity-link" >ErrorToastComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/ExercisesComponent.html" data-type="entity-link" >ExercisesComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/FooterComponent.html" data-type="entity-link" >FooterComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/FooterComponent-1.html" data-type="entity-link" >FooterComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/HomeComponent.html" data-type="entity-link" >HomeComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/HomeComponent-1.html" data-type="entity-link" >HomeComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/LanguageSelectorComponent.html" data-type="entity-link" >LanguageSelectorComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/LoginComponent.html" data-type="entity-link" >LoginComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/MachinesComponent.html" data-type="entity-link" >MachinesComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/MealsComponent.html" data-type="entity-link" >MealsComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/MembershipsComponent.html" data-type="entity-link" >MembershipsComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/NavbarComponent.html" data-type="entity-link" >NavbarComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/NavbarComponent2.html" data-type="entity-link" >NavbarComponent2</a>
                            </li>
                            <li class="link">
                                <a href="components/ProfileImageManagerComponent.html" data-type="entity-link" >ProfileImageManagerComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/QrComponent.html" data-type="entity-link" >QrComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/QrScannerComponent.html" data-type="entity-link" >QrScannerComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/RegisterComponent.html" data-type="entity-link" >RegisterComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/ThemeToggleComponent.html" data-type="entity-link" >ThemeToggleComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/TicketsComponent.html" data-type="entity-link" >TicketsComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/TrainersComponent.html" data-type="entity-link" >TrainersComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/UsersComponent.html" data-type="entity-link" >UsersComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/WorkoutsComponent.html" data-type="entity-link" >WorkoutsComponent</a>
                            </li>
                        </ul>
                    </li>
                        <li class="chapter">
                            <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ? 'data-bs-target="#directives-links"' :
                                'data-bs-target="#xs-directives-links"' }>
                                <span class="icon ion-md-code-working"></span>
                                <span>Directives</span>
                                <span class="icon ion-ios-arrow-down"></span>
                            </div>
                            <ul class="links collapse " ${ isNormalMode ? 'id="directives-links"' : 'id="xs-directives-links"' }>
                                <li class="link">
                                    <a href="directives/ClickOutsideDirective.html" data-type="entity-link" >ClickOutsideDirective</a>
                                </li>
                            </ul>
                        </li>
                    <li class="chapter">
                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ? 'data-bs-target="#classes-links"' :
                            'data-bs-target="#xs-classes-links"' }>
                            <span class="icon ion-ios-paper"></span>
                            <span>Classes</span>
                            <span class="icon ion-ios-arrow-down"></span>
                        </div>
                        <ul class="links collapse " ${ isNormalMode ? 'id="classes-links"' : 'id="xs-classes-links"' }>
                            <li class="link">
                                <a href="classes/CustomTranslateLoader.html" data-type="entity-link" >CustomTranslateLoader</a>
                            </li>
                        </ul>
                    </li>
                        <li class="chapter">
                            <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ? 'data-bs-target="#injectables-links"' :
                                'data-bs-target="#xs-injectables-links"' }>
                                <span class="icon ion-md-arrow-round-down"></span>
                                <span>Injectables</span>
                                <span class="icon ion-ios-arrow-down"></span>
                            </div>
                            <ul class="links collapse " ${ isNormalMode ? 'id="injectables-links"' : 'id="xs-injectables-links"' }>
                                <li class="link">
                                    <a href="injectables/AiService.html" data-type="entity-link" >AiService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/AuthService.html" data-type="entity-link" >AuthService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/CentersService.html" data-type="entity-link" >CentersService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/ClassesService.html" data-type="entity-link" >ClassesService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/DietsService.html" data-type="entity-link" >DietsService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/ErrorService.html" data-type="entity-link" >ErrorService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/ExercisesService.html" data-type="entity-link" >ExercisesService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/GlobalErrorHandler.html" data-type="entity-link" >GlobalErrorHandler</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/HbsRenderService.html" data-type="entity-link" >HbsRenderService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/LocalStorageAuthService.html" data-type="entity-link" >LocalStorageAuthService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/MachinesService.html" data-type="entity-link" >MachinesService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/MealsService.html" data-type="entity-link" >MealsService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/MembershipsService.html" data-type="entity-link" >MembershipsService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/NotificationService.html" data-type="entity-link" >NotificationService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/TemplateEditorService.html" data-type="entity-link" >TemplateEditorService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/ThemeService.html" data-type="entity-link" >ThemeService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/TicketsService.html" data-type="entity-link" >TicketsService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/TranslationService.html" data-type="entity-link" >TranslationService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/UsersService.html" data-type="entity-link" >UsersService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/WorkoutsService.html" data-type="entity-link" >WorkoutsService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/ZipExportService.html" data-type="entity-link" >ZipExportService</a>
                                </li>
                            </ul>
                        </li>
                    <li class="chapter">
                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ? 'data-bs-target="#interfaces-links"' :
                            'data-bs-target="#xs-interfaces-links"' }>
                            <span class="icon ion-md-information-circle-outline"></span>
                            <span>Interfaces</span>
                            <span class="icon ion-ios-arrow-down"></span>
                        </div>
                        <ul class="links collapse " ${ isNormalMode ? ' id="interfaces-links"' : 'id="xs-interfaces-links"' }>
                            <li class="link">
                                <a href="interfaces/AddCenterToClassInput.html" data-type="entity-link" >AddCenterToClassInput</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/AddExerciseToWorkoutInput.html" data-type="entity-link" >AddExerciseToWorkoutInput</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/AddMachineToCenterInput.html" data-type="entity-link" >AddMachineToCenterInput</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/AddMealToDietInput.html" data-type="entity-link" >AddMealToDietInput</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/AiGeneratedPlan.html" data-type="entity-link" >AiGeneratedPlan</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/AppError.html" data-type="entity-link" >AppError</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/AuthInput.html" data-type="entity-link" >AuthInput</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/AuthResponse.html" data-type="entity-link" >AuthResponse</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Center.html" data-type="entity-link" >Center</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ChatMessage.html" data-type="entity-link" >ChatMessage</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ChatResponse.html" data-type="entity-link" >ChatResponse</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ChatSession.html" data-type="entity-link" >ChatSession</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ClassCenterSchedule.html" data-type="entity-link" >ClassCenterSchedule</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ClassTrainer.html" data-type="entity-link" >ClassTrainer</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/CompoDocConfig.html" data-type="entity-link" >CompoDocConfig</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/CreateCenterInput.html" data-type="entity-link" >CreateCenterInput</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/CreateClassInput.html" data-type="entity-link" >CreateClassInput</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/CreateDietInput.html" data-type="entity-link" >CreateDietInput</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/CreateExerciseInput.html" data-type="entity-link" >CreateExerciseInput</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/CreateMachineTypeInput.html" data-type="entity-link" >CreateMachineTypeInput</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/CreateMealInput.html" data-type="entity-link" >CreateMealInput</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/CreateMembershipPlanInput.html" data-type="entity-link" >CreateMembershipPlanInput</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/CreateTicketInput.html" data-type="entity-link" >CreateTicketInput</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/CreateWorkoutInput.html" data-type="entity-link" >CreateWorkoutInput</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Credentials.html" data-type="entity-link" >Credentials</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Diet.html" data-type="entity-link" >Diet</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/DietMeal.html" data-type="entity-link" >DietMeal</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Exercise.html" data-type="entity-link" >Exercise</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/GymClass.html" data-type="entity-link" >GymClass</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/LoginResponse.html" data-type="entity-link" >LoginResponse</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Machine.html" data-type="entity-link" >Machine</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/MachineCenterInstance.html" data-type="entity-link" >MachineCenterInstance</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/MachineTypeModel.html" data-type="entity-link" >MachineTypeModel</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Meal.html" data-type="entity-link" >Meal</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/MembershipPlan.html" data-type="entity-link" >MembershipPlan</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Notification.html" data-type="entity-link" >Notification</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/RegisterInfo.html" data-type="entity-link" >RegisterInfo</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/RegisterInput.html" data-type="entity-link" >RegisterInput</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ReorderDietMealsInput.html" data-type="entity-link" >ReorderDietMealsInput</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ReorderWorkoutExercisesInput.html" data-type="entity-link" >ReorderWorkoutExercisesInput</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ScanResult.html" data-type="entity-link" >ScanResult</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Session.html" data-type="entity-link" >Session</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Template.html" data-type="entity-link" >Template</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Ticket.html" data-type="entity-link" >Ticket</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/UpdateCenterInput.html" data-type="entity-link" >UpdateCenterInput</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/UpdateClassInput.html" data-type="entity-link" >UpdateClassInput</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/UpdateDietInput.html" data-type="entity-link" >UpdateDietInput</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/UpdateDietMealInput.html" data-type="entity-link" >UpdateDietMealInput</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/UpdateExerciseInput.html" data-type="entity-link" >UpdateExerciseInput</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/UpdateMachineInCenterInput.html" data-type="entity-link" >UpdateMachineInCenterInput</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/UpdateMachineTypeInput.html" data-type="entity-link" >UpdateMachineTypeInput</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/UpdateMealInput.html" data-type="entity-link" >UpdateMealInput</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/UpdateMembershipPlanInput.html" data-type="entity-link" >UpdateMembershipPlanInput</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/UpdateTicketInput.html" data-type="entity-link" >UpdateTicketInput</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/UpdateUserInput.html" data-type="entity-link" >UpdateUserInput</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/UpdateWorkoutExerciseInput.html" data-type="entity-link" >UpdateWorkoutExerciseInput</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/UpdateWorkoutInput.html" data-type="entity-link" >UpdateWorkoutInput</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/User.html" data-type="entity-link" >User</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Workout.html" data-type="entity-link" >Workout</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/WorkoutExercise.html" data-type="entity-link" >WorkoutExercise</a>
                            </li>
                        </ul>
                    </li>
                    <li class="chapter">
                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ? 'data-bs-target="#miscellaneous-links"'
                            : 'data-bs-target="#xs-miscellaneous-links"' }>
                            <span class="icon ion-ios-cube"></span>
                            <span>Miscellaneous</span>
                            <span class="icon ion-ios-arrow-down"></span>
                        </div>
                        <ul class="links collapse " ${ isNormalMode ? 'id="miscellaneous-links"' : 'id="xs-miscellaneous-links"' }>
                            <li class="link">
                                <a href="miscellaneous/enumerations.html" data-type="entity-link">Enums</a>
                            </li>
                            <li class="link">
                                <a href="miscellaneous/functions.html" data-type="entity-link">Functions</a>
                            </li>
                            <li class="link">
                                <a href="miscellaneous/typealiases.html" data-type="entity-link">Type aliases</a>
                            </li>
                            <li class="link">
                                <a href="miscellaneous/variables.html" data-type="entity-link">Variables</a>
                            </li>
                        </ul>
                    </li>
                        <li class="chapter">
                            <a data-type="chapter-link" href="routes.html"><span class="icon ion-ios-git-branch"></span>Routes</a>
                        </li>
                    <li class="chapter">
                        <a data-type="chapter-link" href="coverage.html"><span class="icon ion-ios-stats"></span>Documentation coverage</a>
                    </li>
                    <li class="divider"></li>
                    <li class="copyright">
                        Documentation generated using <a href="https://compodoc.app/" target="_blank" rel="noopener noreferrer">
                            <img data-src="images/compodoc-vectorise.png" class="img-responsive" data-type="compodoc-logo">
                        </a>
                    </li>
            </ul>
        </nav>
        `);
        this.innerHTML = tp.strings;
    }
});