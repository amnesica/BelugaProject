import {
  ChangeDetectionStrategy,
  Component,
  inject,
  Input,
  OnInit,
} from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ToolbarService } from 'src/app/_services/toolbar-service/toolbar-service.service';
import { dummyParentAnimation } from 'src/app/_common/animations';
import { SettingsService } from 'src/app/_services/settings-service/settings-service.service';
import { BreakpointObserver, BreakpointState } from '@angular/cdk/layout';
import { ServerService } from 'src/app/_services/server-service/server-service.service';
import { ThemeManager } from 'src/app/_services/theme-service/theme-manager.service';

@Component({
  selector: 'app-toolbar',
  changeDetection: ChangeDetectionStrategy.Default,
  templateUrl: './toolbar.component.html',
  styleUrls: ['./toolbar.component.scss'],
  animations: [dummyParentAnimation],
})
export class ToolbarComponent implements OnInit {
  // Boolean, ob System im DarkMode ist
  darkMode: boolean = false;

  themeManager = inject(ThemeManager);
  isDark$ = this.themeManager.isDark$;

  // Desktop/Mobile view
  isDesktop: boolean = false;

  // Flugzeug-Zähler
  counterAircraft: number = 0;

  // Ort-Suche
  inputPlace = 'Search place';

  private ngUnsubscribe = new Subject();

  constructor(
    private toolbarService: ToolbarService,
    public settingsService: SettingsService,
    public breakpointObserver: BreakpointObserver,
    private serverService: ServerService
  ) {}

  ngOnInit(): void {
    // Initiierung der Abonnements
    this.initSubscriptions();
    this.initBreakPointObserver();
  }

  ngOnDestroy() {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

  /**
   * Initiierung der Abonnements
   */
  initSubscriptions() {
    // Aktualisiere Flugzeug-Zähler
    this.toolbarService.counterAircraft$
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((counterAircraft) => {
        this.counterAircraft = counterAircraft;
      });
  }

  private initBreakPointObserver() {
    this.breakpointObserver
      .observe(['(max-width: 599px)'])
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((state: BreakpointState) => {
        if (state.matches) {
          this.isDesktop = false; // Mobile
        } else {
          this.isDesktop = true; // Desktop
        }
      });
  }

  resetMapPosition() {
    this.settingsService.toggleResetMapPosition(true);
  }

  searchLocation(inputPlace: String) {
    this.inputPlace = 'Search place';
    if (inputPlace.length == 0) return;

    this.fetchAddressFromServer(inputPlace);
  }

  private fetchAddressFromServer(inputLocation: String) {
    this.serverService
      .getAddressFromServer(inputLocation)
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((coordinatesJson) =>
        this.processCoordinatesFromServer(coordinatesJson)
      );
  }

  private processCoordinatesFromServer(coordinatesJson: any): void {
    this.settingsService.nominatimFetchedCoordinates(coordinatesJson);
  }
}
