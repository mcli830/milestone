import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { IndexPageComponent } from './pages/index-page/index-page.component';
import { AuthPageComponent } from './pages/auth-page/auth-page.component';

const routes: Routes = [
  { path: '', component: IndexPageComponent },
  { path: 'register', component: AuthPageComponent },
  { path: 'login', component: AuthPageComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
