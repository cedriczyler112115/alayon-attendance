<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * @property int $brgy_code
 * @property string $brgy_name
 * @property int $city_code
 * @property int $brgy_mode
 * @property int $urb_rur
 * @property string|null $psgc_bgy
 */
class Barangay extends Model
{
    protected $table = 'lib_brgy';

    protected $primaryKey = 'brgy_code';

    public $incrementing = true;

    protected $keyType = 'int';

    public $timestamps = false;

    protected $fillable = [
        'brgy_code',
        'brgy_name',
        'city_code',
        'brgy_mode',
        'urb_rur',
        'psgc_bgy',
    ];

    /**
     * Get the city this barangay belongs to.
     */
    public function city(): BelongsTo
    {
        return $this->belongsTo(City::class, 'city_code', 'city_code');
    }

    /**
     * Get the attendees in this barangay.
     */
    public function attendees(): HasMany
    {
        return $this->hasMany(Attendee::class, 'brgy_id', 'brgy_code');
    }
}
